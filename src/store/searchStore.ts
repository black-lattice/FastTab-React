import { create } from 'zustand';

const STORAGE_KEY = 'fasttab-search-engine';

interface SearchEngine {
	value: 'google' | 'bing' | 'baidu';
	label: string;
	icon: string;
	searchUrl: string;
}

const DEFAULT_ENGINES: SearchEngine[] = [
	{
		value: 'google',
		label: 'Google',
		icon: 'G',
		searchUrl: 'https://www.google.com/search?q='
	},
	{
		value: 'bing',
		label: 'Bing',
		icon: 'B',
		searchUrl: 'https://www.bing.com/search?q='
	},
	{
		value: 'baidu',
		label: '百度',
		icon: '百',
		searchUrl: 'https://www.baidu.com/s?wd='
	}
];

interface SearchState {
	searchQuery: string;
	selectedEngine: SearchEngine;
	searchEngines: SearchEngine[];
	setSearchQuery: (query: string) => void;
	setSelectedEngine: (engine: SearchEngine) => void;
	performSearch: (query: string) => void;
	loadSettings: () => Promise<void>;
}

export const useSearchStore = create<SearchState>((set, get) => ({
	searchQuery: '',
	selectedEngine: DEFAULT_ENGINES[2], // 默认百度
	searchEngines: DEFAULT_ENGINES,

	setSearchQuery: (searchQuery: string) => set({ searchQuery }),

	setSelectedEngine: (selectedEngine: SearchEngine) => {
		set({ selectedEngine });
		try {
			chrome.storage.sync.set({ [STORAGE_KEY]: selectedEngine.value });
		} catch (error) {
			console.error('保存搜索引擎设置失败:', error);
		}
	},

	performSearch: (query: string) => {
		if (!query.trim()) return;
		const { selectedEngine } = get();
		const searchUrl = selectedEngine.searchUrl + encodeURIComponent(query);
		window.location.href = searchUrl;
	},

	loadSettings: async () => {
		try {
			const result = await chrome.storage.sync.get([STORAGE_KEY]);
			const savedEngineValue = result[STORAGE_KEY];
			if (savedEngineValue) {
				const engine = DEFAULT_ENGINES.find(e => e.value === savedEngineValue);
				if (engine) {
					set({ selectedEngine: engine });
				}
			}
		} catch (error) {
			console.error('加载搜索引擎设置失败:', error);
		}
	}
}));
