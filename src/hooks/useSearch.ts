import { useState, useCallback } from 'react';
import { SearchEngine } from '../types';

export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<SearchEngine>({
    value: 'google',
    label: '🔍 Google',
    icon: '🔍',
    searchUrl: 'https://www.google.com/search?q='
  });

  const searchEngines: SearchEngine[] = [
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

  const performSearch = useCallback(
    (query: string) => {
      if (!query.trim()) return;

      const searchUrl = selectedEngine.searchUrl + encodeURIComponent(query);
      window.open(searchUrl, '_blank');
    },
    [selectedEngine]
  );

  const handleSearch = useCallback(() => {
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  return {
    searchQuery,
    setSearchQuery,
    selectedEngine,
    setSelectedEngine,
    searchEngines,
    performSearch,
    handleSearch,
    handleKeyPress
  };
};
