import { create } from 'zustand';
import { SearchEngine } from '../types';

interface SearchState {
  searchQuery: string;
  selectedEngine: SearchEngine;
  searchEngines: SearchEngine[];
  setSearchQuery: (query: string) => void;
  setSelectedEngine: (engine: SearchEngine) => void;
  performSearch: (query: string) => void;
  loadSettings: () => Promise<void>;
}

const DEFAULT_ENGINES: SearchEngine[] = [
  {
    value: 'google',
    label: '🔍 Google',
    icon: '🔍',
    searchUrl: 'https://www.google.com/search?q='
  },
  {
    value: 'bing',
    label: '🔍 Bing',
    icon: '🔍',
    searchUrl: 'https://www.bing.com/search?q='
  },
  {
    value: 'baidu',
    label: '🔍 百度',
    icon: '🔍',
    searchUrl: 'https://www.baidu.com/s?wd='
  }
];

const STORAGE_KEY = 'fasttab-search-settings';

export const useSearchStore = create<SearchState>()((set, get) => ({
  searchQuery: '',
  selectedEngine: DEFAULT_ENGINES[0],
  searchEngines: DEFAULT_ENGINES,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  
  setSelectedEngine: async (selectedEngine) => {
    set({ selectedEngine });
    try {
      await chrome.storage.sync.set({ [STORAGE_KEY]: selectedEngine.value });
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
