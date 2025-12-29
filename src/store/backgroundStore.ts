import { create } from 'zustand';

export interface BackgroundSettings {
	type: 'color' | 'image';
	value: string;
}

const STORAGE_KEY = 'fasttab-background-settings';
const DEFAULT_SETTINGS: BackgroundSettings = {
	type: 'color',
	value: '#f5f5f5'
};

interface BackgroundState {
	settings: BackgroundSettings;
	isLoaded: boolean;
	setSettings: (settings: BackgroundSettings) => void;
	loadSettings: () => Promise<void>;
	saveSettings: (newSettings: BackgroundSettings) => Promise<void>;
	clearBackground: () => Promise<void>;
	applyBackground: (bgSettings: BackgroundSettings) => void;
}

/**
 * 判断颜色是否为深色
 */
const isDarkColor = (color: string): boolean => {
	if (color.startsWith('#')) {
		const hex = color.replace('#', '');
		const r = parseInt(hex.substring(0, 2), 16);
		const g = parseInt(hex.substring(2, 4), 16);
		const b = parseInt(hex.substring(4, 6), 16);
		const brightness = (r * 299 + g * 587 + b * 114) / 1000;
		return brightness < 128;
	}

	if (color.startsWith('rgb')) {
		const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
		if (match) {
			const r = parseInt(match[1]);
			const g = parseInt(match[2]);
			const b = parseInt(match[3]);
			const brightness = (r * 299 + g * 587 + b * 114) / 1000;
			return brightness < 128;
		}
	}
	return false;
};

export const useBackgroundStore = create<BackgroundState>((set, get) => ({
	settings: DEFAULT_SETTINGS,
	isLoaded: false,

	setSettings: (settings: BackgroundSettings) => set({ settings }),

	loadSettings: async () => {
		try {
			const result = await chrome.storage.sync.get([STORAGE_KEY]);
			const savedSettings = result[STORAGE_KEY];
			if (savedSettings) {
				set({ settings: savedSettings });
				get().applyBackground(savedSettings);
			} else {
				get().applyBackground(DEFAULT_SETTINGS);
			}
			set({ isLoaded: true });
		} catch (error) {
			console.error('加载背景设置失败:', error);
			set({ isLoaded: true });
		}
	},

	saveSettings: async (newSettings: BackgroundSettings) => {
		try {
			await chrome.storage.sync.set({ [STORAGE_KEY]: newSettings });
			set({ settings: newSettings });
			get().applyBackground(newSettings);
		} catch (error) {
			console.error('保存背景设置失败:', error);
		}
	},

	applyBackground: (bgSettings: BackgroundSettings) => {
		const body = document.body;
		body.classList.remove('show-overlay', 'hide-overlay');

		if (bgSettings.type === 'color') {
			body.style.background = bgSettings.value;
			body.style.backgroundAttachment = '';
			body.style.backgroundPosition = '';
			body.style.backgroundSize = '';
			body.style.backgroundRepeat = '';

			const isDark = isDarkColor(bgSettings.value);
			if (isDark) {
				body.classList.add('dark-theme');
				body.classList.add('hide-overlay');
				document.documentElement.style.setProperty('--text-primary', '#ffffff');
				document.documentElement.style.setProperty(
					'--text-secondary',
					'#cccccc'
				);
				document.documentElement.style.setProperty(
					'--text-tertiary',
					'#aaaaaa'
				);
			} else {
				body.classList.remove('dark-theme');
				body.classList.add('show-overlay');
				document.documentElement.style.setProperty('--text-primary', '#333333');
				document.documentElement.style.setProperty(
					'--text-secondary',
					'#666666'
				);
				document.documentElement.style.setProperty(
					'--text-tertiary',
					'#999999'
				);
			}
		} else if (bgSettings.type === 'image') {
			body.style.background = `url(${bgSettings.value})`;
			body.style.backgroundAttachment = 'fixed';
			body.style.backgroundPosition = 'center';
			body.style.backgroundSize = 'cover';
			body.style.backgroundRepeat = 'no-repeat';

			body.classList.add('dark-theme');
			body.classList.add('show-overlay');
			document.documentElement.style.setProperty('--text-primary', '#ffffff');
			document.documentElement.style.setProperty('--text-secondary', '#cccccc');
			document.documentElement.style.setProperty('--text-tertiary', '#aaaaaa');
		}
	},

	clearBackground: async () => {
		await get().saveSettings(DEFAULT_SETTINGS);
		const body = document.body;
		body.style.background = '';
		body.style.backgroundAttachment = '';
		body.style.backgroundPosition = '';
		body.style.backgroundSize = '';
		body.style.backgroundRepeat = '';
		body.classList.remove('show-overlay', 'hide-overlay');
	}
}));
