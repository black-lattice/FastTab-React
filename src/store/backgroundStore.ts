import { create } from 'zustand';
import {
	clearBackgroundImage,
	loadBackgroundImage,
	saveBackgroundImage
} from '../utils/backgroundStorage';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export interface BackgroundSettings {
	type: 'theme' | 'image';
	value: string;
	themeMode: ThemeMode;
}

const STORAGE_KEY = 'fasttab-background-settings';
const DEFAULT_SETTINGS: BackgroundSettings = {
	type: 'theme',
	value: '',
	themeMode: 'system'
};

interface BackgroundState {
	settings: BackgroundSettings;
	resolvedTheme: ResolvedTheme;
	hasLocalBackground: boolean;
	isLoaded: boolean;
	loadSettings: () => Promise<void>;
	saveSettings: (settings: BackgroundSettings) => Promise<void>;
	saveBackgroundFromFile: (file: File) => Promise<void>;
	saveBackgroundFromUrl: (url: string) => Promise<void>;
	clearBackground: () => Promise<void>;
	applyBackground: (settings: BackgroundSettings) => Promise<void>;
	applyTheme: (themeMode: ThemeMode) => void;
}

let activeObjectUrl: string | null = null;
let systemThemeListenerAdded = false;

const setBodyBackground = (url?: string) => {
	const body = document.body;
	if (activeObjectUrl && activeObjectUrl !== url) {
		URL.revokeObjectURL(activeObjectUrl);
		activeObjectUrl = null;
	}

	if (url) {
		body.style.backgroundImage = `url(${JSON.stringify(url)})`;
		body.style.backgroundAttachment = 'fixed';
		body.style.backgroundPosition = 'center';
		body.style.backgroundSize = 'cover';
		body.style.backgroundRepeat = 'no-repeat';
		body.classList.add('show-overlay');
		body.classList.remove('hide-overlay');
		return;
	}

	body.style.backgroundImage = '';
	body.style.backgroundAttachment = '';
	body.style.backgroundPosition = '';
	body.style.backgroundSize = '';
	body.style.backgroundRepeat = '';
	body.classList.remove('show-overlay');
	body.classList.add('hide-overlay');
};

const getOriginPattern = (url: string) => {
	const parsedUrl = new URL(url);
	if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
		throw new Error('仅支持 HTTP 或 HTTPS 图片地址');
	}
	return `${parsedUrl.origin}/*`;
};

export const useBackgroundStore = create<BackgroundState>((set, get) => ({
	settings: DEFAULT_SETTINGS,
	resolvedTheme: 'light',
	hasLocalBackground: false,
	isLoaded: false,

	loadSettings: async () => {
		try {
			const result = await chrome.storage.sync.get([STORAGE_KEY]);
			const storedSettings = result[STORAGE_KEY];
			const settings: BackgroundSettings = storedSettings
				? {
						...DEFAULT_SETTINGS,
						...storedSettings,
						type: storedSettings.type === 'image' ? 'image' : 'theme'
					}
				: DEFAULT_SETTINGS;

			set({ settings });
			get().applyTheme(settings.themeMode);
			await get().applyBackground(settings);

			if (!systemThemeListenerAdded) {
				window.matchMedia('(prefers-color-scheme: dark)').addEventListener(
					'change',
					() => {
						if (get().settings.themeMode === 'system') {
							get().applyTheme('system');
						}
					}
				);
				systemThemeListenerAdded = true;
			}
		} catch (error) {
			console.error('加载外观设置失败:', error);
		} finally {
			set({ isLoaded: true });
		}
	},

	saveSettings: async settings => {
		await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
		set({ settings });
		get().applyTheme(settings.themeMode);
		await get().applyBackground(settings);
	},

	saveBackgroundFromFile: async file => {
		if (!file.type.startsWith('image/')) {
			throw new Error('请选择图片文件');
		}
		await saveBackgroundImage(file);
		const settings = { ...get().settings, type: 'image' as const, value: '' };
		await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
		set({ settings });
		await get().applyBackground(settings);
	},

	saveBackgroundFromUrl: async url => {
		const normalizedUrl = url.trim();
		const originPattern = getOriginPattern(normalizedUrl);
		const granted = await chrome.permissions.request({
			origins: [originPattern]
		});
		if (!granted) {
			throw new Error('未获得图片站点访问权限');
		}

		const response = await fetch(normalizedUrl);
		if (!response.ok) {
			throw new Error(`图片下载失败（${response.status}）`);
		}
		const blob = await response.blob();
		if (!blob.type.startsWith('image/')) {
			throw new Error('该地址返回的内容不是图片');
		}
		await saveBackgroundImage(blob);
		const settings = {
			...get().settings,
			type: 'image' as const,
			value: normalizedUrl
		};
		await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
		set({ settings });
		await get().applyBackground(settings);
	},

	clearBackground: async () => {
		await clearBackgroundImage();
		const settings = {
			...DEFAULT_SETTINGS,
			themeMode: get().settings.themeMode
		};
		await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
		set({ settings });
		await get().applyBackground(settings);
	},

	applyBackground: async settings => {
		if (settings.type === 'image') {
			const localImage = await loadBackgroundImage();
			if (localImage) {
				const localUrl = URL.createObjectURL(localImage);
				setBodyBackground(localUrl);
				activeObjectUrl = localUrl;
				set({ hasLocalBackground: true });
				return;
			}
			set({ hasLocalBackground: false });
			if (settings.value) {
				setBodyBackground(settings.value);
				return;
			}
		}
		set({ hasLocalBackground: false });
		setBodyBackground();
	},

	applyTheme: themeMode => {
		const resolvedTheme =
			themeMode === 'system'
				? window.matchMedia('(prefers-color-scheme: dark)').matches
					? 'dark'
					: 'light'
				: themeMode;
		document.documentElement.dataset.theme = resolvedTheme;
		set({ resolvedTheme });
	}
}));
