import { create } from 'zustand';
import type { BookmarkUsage } from '../utils/bookmarkSearch';

const LEGACY_STORAGE_KEY = 'fasttab-search-engine';
const SETTINGS_STORAGE_KEY = 'fasttab-search-settings';
const USAGE_STORAGE_KEY = 'fasttab-bookmark-usage';

export type SearchOpenBehavior = 'current' | 'new' | 'background';

export interface SearchEngine {
	id: string;
	value: string;
	label: string;
	icon: string;
	searchUrl: string;
	isCustom?: boolean;
}

interface StoredSearchSettings {
	selectedEngineId: string;
	customEngines: SearchEngine[];
	openBehavior: SearchOpenBehavior;
}

export const DEFAULT_ENGINES: SearchEngine[] = [
	{
		id: 'google',
		value: 'google',
		label: 'Google',
		icon: 'G',
		searchUrl: 'https://www.google.com/search?q={query}'
	},
	{
		id: 'bing',
		value: 'bing',
		label: 'Bing',
		icon: 'B',
		searchUrl: 'https://www.bing.com/search?q={query}'
	},
	{
		id: 'baidu',
		value: 'baidu',
		label: '百度',
		icon: '百',
		searchUrl: 'https://www.baidu.com/s?wd={query}'
	}
];

const isOpenBehavior = (value: unknown): value is SearchOpenBehavior =>
	['current', 'new', 'background'].includes(String(value));

const normalizeCustomEngine = (engine: unknown): SearchEngine | null => {
	if (!engine || typeof engine !== 'object') return null;
	const value = engine as Partial<SearchEngine>;
	if (
		typeof value.id !== 'string' ||
		typeof value.label !== 'string' ||
		typeof value.searchUrl !== 'string' ||
		!value.searchUrl.includes('{query}')
	) return null;
	try {
		const parsedUrl = new URL(value.searchUrl.replace('{query}', 'test'));
		if (!['http:', 'https:'].includes(parsedUrl.protocol)) return null;
	} catch {
		return null;
	}
	return {
		id: value.id,
		value: value.id,
		label: value.label.trim(),
		icon: value.icon?.trim() || value.label.trim().charAt(0).toUpperCase(),
		searchUrl: value.searchUrl,
		isCustom: true
	};
};

export const normalizeSearchEngineUrl = (value: string) => {
	const template = value.trim().replace('%s', '{query}');
	if (!template.includes('{query}')) {
		throw new Error('搜索地址需要包含 {query} 占位符');
	}
	const parsedUrl = new URL(template.replace('{query}', 'test'));
	if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
		throw new Error('搜索地址仅支持 HTTP 或 HTTPS');
	}
	return template;
};

interface SearchState {
	searchQuery: string;
	selectedEngine: SearchEngine;
	searchEngines: SearchEngine[];
	customEngines: SearchEngine[];
	openBehavior: SearchOpenBehavior;
	bookmarkUsage: Record<string, BookmarkUsage>;
	setSearchQuery: (query: string) => void;
	setSelectedEngine: (engine: SearchEngine) => void;
	setOpenBehavior: (behavior: SearchOpenBehavior) => Promise<void>;
	addCustomEngine: (label: string, searchUrl: string) => Promise<void>;
	removeCustomEngine: (id: string) => Promise<void>;
	performSearch: (query: string) => void;
	recordBookmarkVisit: (id: string) => void;
	loadSettings: () => Promise<void>;
}

const persistSettings = async (
	selectedEngineId: string,
	customEngines: SearchEngine[],
	openBehavior: SearchOpenBehavior
) => {
	const settings: StoredSearchSettings = {
		selectedEngineId,
		customEngines,
		openBehavior
	};
	await chrome.storage.sync.set({ [SETTINGS_STORAGE_KEY]: settings });
};

export const useSearchStore = create<SearchState>((set, get) => ({
	searchQuery: '',
	selectedEngine: DEFAULT_ENGINES[2],
	searchEngines: DEFAULT_ENGINES,
	customEngines: [],
	openBehavior: 'current',
	bookmarkUsage: {},

	setSearchQuery: searchQuery => set({ searchQuery }),

	setSelectedEngine: selectedEngine => {
		set({ selectedEngine });
		void persistSettings(
			selectedEngine.id,
			get().customEngines,
			get().openBehavior
		).catch(error => console.error('保存搜索引擎设置失败:', error));
	},

	setOpenBehavior: async openBehavior => {
		await persistSettings(
			get().selectedEngine.id,
			get().customEngines,
			openBehavior
		);
		set({ openBehavior });
	},

	addCustomEngine: async (label, searchUrl) => {
		const normalizedLabel = label.trim();
		if (!normalizedLabel) throw new Error('请输入搜索引擎名称');
		const normalizedUrl = normalizeSearchEngineUrl(searchUrl);
		const id = `custom-${Date.now()}`;
		const engine: SearchEngine = {
			id,
			value: id,
			label: normalizedLabel,
			icon: normalizedLabel.charAt(0).toUpperCase(),
			searchUrl: normalizedUrl,
			isCustom: true
		};
		const customEngines = [...get().customEngines, engine];
		await persistSettings(engine.id, customEngines, get().openBehavior);
		set({
			customEngines,
			searchEngines: [...DEFAULT_ENGINES, ...customEngines],
			selectedEngine: engine
		});
	},

	removeCustomEngine: async id => {
		const customEngines = get().customEngines.filter(engine => engine.id !== id);
		const selectedEngine = get().selectedEngine.id === id
			? DEFAULT_ENGINES[2]
			: get().selectedEngine;
		await persistSettings(selectedEngine.id, customEngines, get().openBehavior);
		set({
			customEngines,
			searchEngines: [...DEFAULT_ENGINES, ...customEngines],
			selectedEngine
		});
	},

	performSearch: query => {
		const normalizedQuery = query.trim();
		if (!normalizedQuery) return;
		const { selectedEngine, openBehavior } = get();
		const searchUrl = selectedEngine.searchUrl.replace(
			'{query}',
			encodeURIComponent(normalizedQuery)
		);
		if (openBehavior === 'current') {
			window.location.href = searchUrl;
			return;
		}
		void chrome.tabs.create({
			url: searchUrl,
			active: openBehavior === 'new'
		});
	},

	recordBookmarkVisit: id => {
		const currentUsage = get().bookmarkUsage;
		const usage = currentUsage[id];
		const bookmarkUsage = {
			...currentUsage,
			[id]: {
				count: (usage?.count || 0) + 1,
				lastUsed: Date.now()
			}
		};
		set({ bookmarkUsage });
		void chrome.storage.local
			.set({ [USAGE_STORAGE_KEY]: bookmarkUsage })
			.catch(error => console.error('保存书签使用记录失败:', error));
	},

	loadSettings: async () => {
		try {
			const [syncResult, localResult] = await Promise.all([
				chrome.storage.sync.get([SETTINGS_STORAGE_KEY, LEGACY_STORAGE_KEY]),
				chrome.storage.local.get([USAGE_STORAGE_KEY])
			]);
			const stored = syncResult[SETTINGS_STORAGE_KEY] as Partial<StoredSearchSettings> | undefined;
			const customEngines = Array.isArray(stored?.customEngines)
				? stored.customEngines
					.map(normalizeCustomEngine)
					.filter((engine): engine is SearchEngine => Boolean(engine))
				: [];
			const searchEngines = [...DEFAULT_ENGINES, ...customEngines];
			const selectedEngineId = stored?.selectedEngineId || syncResult[LEGACY_STORAGE_KEY];
			const selectedEngine = searchEngines.find(engine => engine.id === selectedEngineId)
				|| DEFAULT_ENGINES[2];
			const openBehavior = isOpenBehavior(stored?.openBehavior)
				? stored.openBehavior
				: 'current';
			const bookmarkUsage = localResult[USAGE_STORAGE_KEY];

			set({
				selectedEngine,
				searchEngines,
				customEngines,
				openBehavior,
				bookmarkUsage: bookmarkUsage && typeof bookmarkUsage === 'object'
					? bookmarkUsage
					: {}
			});
		} catch (error) {
			console.error('加载搜索设置失败:', error);
		}
	}
}));
