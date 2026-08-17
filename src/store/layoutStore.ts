import { create } from 'zustand';

export type BookmarkIconSize = 48 | 60 | 72;
export type LayoutDensity = 'compact' | 'standard' | 'comfortable';
export type BookmarkTitleLines = 0 | 1 | 2;
export type FolderPosition = 'bookmarks-first' | 'folders-first';

export interface LayoutSettings {
	iconSize: BookmarkIconSize;
	density: LayoutDensity;
	titleLines: BookmarkTitleLines;
	maxColumns: number;
	folderPosition: FolderPosition;
}

export const DEFAULT_LAYOUT_SETTINGS: LayoutSettings = {
	iconSize: 60,
	density: 'standard',
	titleLines: 2,
	maxColumns: 12,
	folderPosition: 'bookmarks-first'
};

const STORAGE_KEY = 'fasttab-layout-settings';
const ICON_SIZES: BookmarkIconSize[] = [48, 60, 72];
const DENSITIES: LayoutDensity[] = ['compact', 'standard', 'comfortable'];
const TITLE_LINES: BookmarkTitleLines[] = [0, 1, 2];
const FOLDER_POSITIONS: FolderPosition[] = ['bookmarks-first', 'folders-first'];

const isOneOf = <T extends string | number>(value: unknown, values: T[]): value is T =>
	values.includes(value as T);

export const normalizeLayoutSettings = (value: unknown): LayoutSettings => {
	const stored = value && typeof value === 'object'
		? value as Partial<LayoutSettings>
		: {};
	const maxColumns = Number(stored.maxColumns);

	return {
		iconSize: isOneOf(stored.iconSize, ICON_SIZES)
			? stored.iconSize
			: DEFAULT_LAYOUT_SETTINGS.iconSize,
		density: isOneOf(stored.density, DENSITIES)
			? stored.density
			: DEFAULT_LAYOUT_SETTINGS.density,
		titleLines: isOneOf(stored.titleLines, TITLE_LINES)
			? stored.titleLines
			: DEFAULT_LAYOUT_SETTINGS.titleLines,
		maxColumns: Number.isInteger(maxColumns) && maxColumns >= 4 && maxColumns <= 16
			? maxColumns
			: DEFAULT_LAYOUT_SETTINGS.maxColumns,
		folderPosition: isOneOf(stored.folderPosition, FOLDER_POSITIONS)
			? stored.folderPosition
			: DEFAULT_LAYOUT_SETTINGS.folderPosition
	};
};

export const getLayoutMetrics = (settings: LayoutSettings) => {
	const gridGap = settings.density === 'compact'
		? 10
		: settings.density === 'comfortable'
			? 24
			: 16;
	const titleGap = settings.titleLines === 0
		? 0
		: settings.density === 'compact'
			? 6
			: settings.density === 'comfortable'
				? 12
				: 9;

	return {
		cellSize: settings.iconSize + 20,
		frameSize: settings.iconSize + 4,
		gridGap,
		titleGap,
		titleHeight: settings.titleLines * 17
	};
};

const applyLayoutSettings = (settings: LayoutSettings) => {
	const root = document.documentElement;
	const metrics = getLayoutMetrics(settings);
	root.dataset.bookmarkTitleLines = String(settings.titleLines);
	root.style.setProperty('--bookmark-icon-size', `${settings.iconSize}px`);
	root.style.setProperty('--bookmark-frame-size', `${metrics.frameSize}px`);
	root.style.setProperty('--bookmark-cell-size', `${metrics.cellSize}px`);
	root.style.setProperty('--bookmark-grid-gap', `${metrics.gridGap}px`);
	root.style.setProperty('--bookmark-title-gap', `${metrics.titleGap}px`);
	root.style.setProperty('--bookmark-title-height', `${metrics.titleHeight}px`);
	root.style.setProperty('--bookmark-title-lines', String(settings.titleLines));
};

interface LayoutState {
	settings: LayoutSettings;
	isLoaded: boolean;
	loadSettings: () => Promise<void>;
	saveSettings: (settings: LayoutSettings) => Promise<void>;
	resetSettings: () => Promise<void>;
}

export const useLayoutStore = create<LayoutState>(set => ({
	settings: DEFAULT_LAYOUT_SETTINGS,
	isLoaded: false,

	loadSettings: async () => {
		try {
			const result = await chrome.storage.sync.get([STORAGE_KEY]);
			const settings = normalizeLayoutSettings(result[STORAGE_KEY]);
			applyLayoutSettings(settings);
			set({ settings });
		} catch (error) {
			applyLayoutSettings(DEFAULT_LAYOUT_SETTINGS);
			console.error('加载布局设置失败:', error);
		} finally {
			set({ isLoaded: true });
		}
	},

	saveSettings: async value => {
		const settings = normalizeLayoutSettings(value);
		await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
		applyLayoutSettings(settings);
		set({ settings });
	},

	resetSettings: async () => {
		await chrome.storage.sync.remove(STORAGE_KEY);
		applyLayoutSettings(DEFAULT_LAYOUT_SETTINGS);
		set({ settings: DEFAULT_LAYOUT_SETTINGS });
	}
}));
