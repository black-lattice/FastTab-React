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
   * 判断颜色是否为深色
   * 基于W3C的亮度计算公式：Y = 0.299*R + 0.587*G + 0.114*B
   * 如果亮度小于128，则认为是深色
   */
  const isDarkColor = (color: string): boolean => {
    // 处理hex颜色格式
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 128;
    }
    
    // 处理rgb/rgba格式
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
    
    // 默认返回false（浅色背景）
    return false;
  };

  /**
   * 应用背景样式到页面，并根据背景深浅调整文字颜色
   */
  const applyBackground = (bgSettings: BackgroundSettings) => {
    const body = document.body;
    
    if (bgSettings.type === 'color') {
      body.style.background = bgSettings.value;
      body.style.backgroundAttachment = '';
      body.style.backgroundPosition = '';
      body.style.backgroundSize = '';
      body.style.backgroundRepeat = '';
      
      // 根据背景颜色深浅设置文字颜色
      const isDark = isDarkColor(bgSettings.value);
      if (isDark) {
        body.classList.add('dark-theme');
        document.documentElement.style.setProperty('--text-primary', '#ffffff');
        document.documentElement.style.setProperty('--text-secondary', '#cccccc');
        document.documentElement.style.setProperty('--text-tertiary', '#aaaaaa');
      } else {
        body.classList.remove('dark-theme');
        document.documentElement.style.setProperty('--text-primary', '#333333');
        document.documentElement.style.setProperty('--text-secondary', '#666666');
        document.documentElement.style.setProperty('--text-tertiary', '#999999');
      }
    } else if (bgSettings.type === 'image') {
      body.style.background = `url(${bgSettings.value})`;
      body.style.backgroundAttachment = 'fixed';
      body.style.backgroundPosition = 'center';
      body.style.backgroundSize = 'cover';
      body.style.backgroundRepeat = 'no-repeat';
      
      // 图片背景使用深色文字
      body.classList.add('dark-theme');
      document.documentElement.style.setProperty('--text-primary', '#ffffff');
      document.documentElement.style.setProperty('--text-secondary', '#cccccc');
      document.documentElement.style.setProperty('--text-tertiary', '#aaaaaa');
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