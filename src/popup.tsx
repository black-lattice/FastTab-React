import React from 'react';
import ReactDOM from 'react-dom/client';

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
		message.className =
			'fixed top-2.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded text-xs z-[1000]';
		document.body.appendChild(message);
		setTimeout(() => message.remove(), 2000);
	};

	return (
		<div className='w-full'>
			<div className='text-center mb-4'>
				<h1 className='text-blue-600 text-lg m-0 mb-1'>
					FastTab React
				</h1>
				<p className='text-gray-500 text-xs m-0'>快速标签页管理器</p>
			</div>

			<div className='mb-3'>
				<h3 className='text-sm m-0 mb-2 text-gray-800'>快速操作</h3>
				<a
					href='#'
					className='block w-full px-2 py-2 m-1 border-none rounded bg-blue-600 text-white cursor-pointer text-xs text-center no-underline transition-colors hover:bg-blue-700'
					onClick={handleOpenNewTab}>
					打开新标签页
				</a>
				<button
					className='w-full px-2 py-2 m-1 border-none rounded bg-gray-200 text-gray-800 cursor-pointer text-xs hover:bg-gray-300'
					onClick={handleRefreshBookmarks}>
					刷新书签
				</button>
			</div>

			<div className='mb-3'>
				<h3 className='text-sm m-0 mb-2 text-gray-800'>帮助</h3>
				<button
					className='w-full px-2 py-2 m-1 border-none rounded bg-gray-200 text-gray-800 cursor-pointer text-xs hover:bg-gray-300'
					onClick={handleShowHelp}>
					使用帮助
				</button>
			</div>

			<div className='text-xs text-gray-500 text-center mt-2.5'>
				版本 1.0.0 | 快捷键: Ctrl+K 搜索
			</div>
		</div>
	);
};

ReactDOM.createRoot(document.getElementById('popup-root')!).render(
	<React.StrictMode>
		<Popup />
	</React.StrictMode>
);
