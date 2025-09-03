import React from 'react';
import ReactDOM from 'react-dom/client';
import './popup.css';

const Popup: React.FC = () => {
  const handleOpenNewTab = (e: React.MouseEvent) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'chrome://newtab/' });
    window.close();
  };

  const handleRefreshBookmarks = () => {
    chrome.runtime.sendMessage({ action: 'refreshBookmarks' });
    showMessage('书签已刷新');
  };

  const handleShowHelp = () => {
    const helpText = `
快捷键：
• Ctrl+K: 聚焦搜索框
• Ctrl+F: 搜索书签
• Enter: 搜索
• Esc: 关闭对话框

功能：
• 拖拽排序书签
• 实时搜索书签
• 编辑/删除书签
• 多搜索引擎支持
    `;
    alert(helpText);
  };

  const showMessage = (text: string) => {
    const message = document.createElement('div');
    message.textContent = text;
    message.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: #667eea;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
    `;
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 2000);
  };

  return (
    <div className="popup">
      <div className="header">
        <h1>FastTab React</h1>
        <p>快速标签页管理器</p>
      </div>

      <div className="section">
        <h3>快速操作</h3>
        <a href="#" className="button" onClick={handleOpenNewTab}>
          打开新标签页
        </a>
        <button className="button secondary" onClick={handleRefreshBookmarks}>
          刷新书签
        </button>
      </div>

      <div className="section">
        <h3>帮助</h3>
        <button className="button secondary" onClick={handleShowHelp}>
          使用帮助
        </button>
      </div>

      <div className="info">版本 1.0.0 | 快捷键: Ctrl+K 搜索</div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('popup-root')!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
