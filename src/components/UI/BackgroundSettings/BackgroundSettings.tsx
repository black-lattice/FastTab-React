import { useState } from 'react';
import { useBackground, BackgroundSettings as BackgroundConfig } from '../../../hooks/useBackground';
import './BackgroundSettings.css';

/**
 * 背景设置组件
 * 提供纯色和图片背景设置功能，固定在右下角
 */
export const BackgroundSettings = () => {
  const { settings, saveSettings, clearBackground } = useBackground();
  const [isOpen, setIsOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState<BackgroundConfig>(settings);

  // 预设颜色选项
  const presetColors = [
    '#f5f5f5', '#ffffff', '#000000', '#ff6b6b', '#4ecdc4', 
    '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'
  ];

  const handleSave = () => {
    saveSettings(tempSettings);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempSettings(settings);
    setIsOpen(false);
  };

  const handleColorChange = (color: string) => {
    setTempSettings({ type: 'color', value: color });
  };

  const handleImageUrlChange = (url: string) => {
    setTempSettings({ type: 'image', value: url });
  };

  return (
    <div className="background-settings">
      {/* 触发按钮 */}
      <button 
        className="background-settings-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="背景设置"
      >
        🎨
      </button>

      {/* 设置面板 */}
      {isOpen && (
        <div className="background-settings-panel">
          <div className="settings-header">
            <h3>背景设置</h3>
            <button 
              className="close-btn"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="settings-content">
            {/* 背景类型选择 */}
            <div className="setting-group">
              <label>背景类型</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    checked={tempSettings.type === 'color'}
                    onChange={() => setTempSettings({ ...tempSettings, type: 'color' })}
                  />
                  纯色
                </label>
                <label>
                  <input
                    type="radio"
                    checked={tempSettings.type === 'image'}
                    onChange={() => setTempSettings({ ...tempSettings, type: 'image' })}
                  />
                  图片
                </label>
              </div>
            </div>

            {/* 纯色设置 */}
            {tempSettings.type === 'color' && (
              <div className="setting-group">
                <label>选择颜色</label>
                <div className="color-presets">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      className={`color-preset ${tempSettings.value === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorChange(color)}
                      title={color}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={tempSettings.value}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="color-input"
                />
              </div>
            )}

            {/* 图片设置 */}
            {tempSettings.type === 'image' && (
              <div className="setting-group">
                <label>图片URL</label>
                <input
                  type="url"
                  placeholder="输入图片URL"
                  value={tempSettings.value}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  className="url-input"
                />
              </div>
            )}

            {/* 操作按钮 */}
            <div className="settings-actions">
              <button 
                className="save-btn"
                onClick={handleSave}
              >
                保存
              </button>
              <button 
                className="cancel-btn"
                onClick={handleCancel}
              >
                取消
              </button>
              <button 
                className="clear-btn"
                onClick={clearBackground}
              >
                清除背景
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};