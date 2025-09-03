import { useState, useEffect } from 'react';

/**
 * 背景设置Hook
 * 管理扩展的背景样式设置，支持纯色和图片背景
 */
export interface BackgroundSettings {
  type: 'color' | 'image';
  value: string;
}

const STORAGE_KEY = 'fasttab-background-settings';
const DEFAULT_SETTINGS: BackgroundSettings = {
  type: 'color',
  value: '#f5f5f5'
};

export const useBackground = () => {
  const [settings, setSettings] = useState<BackgroundSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  /**
   * 从chrome.storage加载背景设置
   */
  const loadSettings = async () => {
    try {
      const result = await chrome.storage.sync.get([STORAGE_KEY]);
      const savedSettings = result[STORAGE_KEY];
      if (savedSettings) {
        setSettings(savedSettings);
        applyBackground(savedSettings);
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('加载背景设置失败:', error);
      setIsLoaded(true);
    }
  };

  /**
   * 保存背景设置到chrome.storage
   */
  const saveSettings = async (newSettings: BackgroundSettings) => {
    try {
      await chrome.storage.sync.set({ [STORAGE_KEY]: newSettings });
      setSettings(newSettings);
      applyBackground(newSettings);
    } catch (error) {
      console.error('保存背景设置失败:', error);
    }
  };

  /**
   * 应用背景样式到页面
   */
  const applyBackground = (bgSettings: BackgroundSettings) => {
    const body = document.body;
    
    if (bgSettings.type === 'color') {
      body.style.background = bgSettings.value;
      body.style.backgroundAttachment = '';
      body.style.backgroundPosition = '';
      body.style.backgroundSize = '';
      body.style.backgroundRepeat = '';
    } else if (bgSettings.type === 'image') {
      body.style.background = `url(${bgSettings.value})`;
      body.style.backgroundAttachment = 'fixed';
      body.style.backgroundPosition = 'center';
      body.style.backgroundSize = 'cover';
      body.style.backgroundRepeat = 'no-repeat';
    }
  };

  /**
   * 清除背景设置，恢复默认
   */
  const clearBackground = () => {
    saveSettings(DEFAULT_SETTINGS);
    document.body.style.background = '';
    document.body.style.backgroundAttachment = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundRepeat = '';
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    isLoaded,
    saveSettings,
    clearBackground
  };
};