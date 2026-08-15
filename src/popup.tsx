import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
	ArrowRightOutlined,
	CheckCircleFilled,
	ExclamationCircleFilled,
	QuestionCircleOutlined,
	ReloadOutlined
} from '@ant-design/icons';

type StatusMessage = {
	type: 'success' | 'error';
	text: string;
} | null;

const Popup: React.FC = () => {
	const [showHelp, setShowHelp] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [status, setStatus] = useState<StatusMessage>(null);
	const version =
		typeof chrome !== 'undefined' && chrome.runtime?.getManifest
			? chrome.runtime.getManifest().version
			: '开发版';

	const handleOpenNewTab = async () => {
		if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
			await chrome.tabs.create({ url: 'chrome://newtab/' });
			window.close();
			return;
		}
		window.open('./newtab.html', '_blank', 'noopener,noreferrer');
	};
	const handleRefreshBookmarks = async () => {
		setIsRefreshing(true);
		setStatus(null);
		try {
			if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
				throw new Error('扩展运行环境不可用');
			}
			const response = await chrome.runtime.sendMessage({
				action: 'refreshBookmarks'
			});
			if (!response?.ok) throw new Error('刷新失败');
			setStatus({ type: 'success', text: '书签已同步' });
		} catch {
			setStatus({
				type: 'error',
				text: '请先打开一个 FastTab 新标签页'
			});
		} finally {
			setIsRefreshing(false);
		}
	};

	return (
		<main className='popup-shell'>
			<header className='popup-header'>
				<img src='../icons/favicon.svg' alt='' className='popup-logo' />
				<div>
					<h1>FastTab</h1>
					<p>让常用网址触手可及</p>
				</div>
			</header>

			<button
				type='button'
				className='popup-primary-action'
				onClick={() => void handleOpenNewTab()}>
				<span>打开新标签页</span>
				<ArrowRightOutlined />
			</button>

			<div className='popup-secondary-actions'>
				<button
					type='button'
					onClick={() => void handleRefreshBookmarks()}
					disabled={isRefreshing}>
					<ReloadOutlined spin={isRefreshing} />
					<span>{isRefreshing ? '同步中…' : '同步书签'}</span>
				</button>
				<button
					type='button'
					onClick={() => setShowHelp(value => !value)}
					aria-expanded={showHelp}>
					<QuestionCircleOutlined />
					<span>快捷键</span>
				</button>
			</div>

			{status && (
				<div className={`popup-status is-${status.type}`} role='status' aria-live='polite'>
					{status.type === 'success' ? <CheckCircleFilled /> : <ExclamationCircleFilled />}
					<span>{status.text}</span>
				</div>
			)}

			{showHelp && (
				<section className='popup-help' aria-label='快捷键说明'>
					<div><kbd>⌘/Ctrl</kbd><span>+</span><kbd>K</kbd><p>聚焦搜索</p></div>
					<div><kbd>↑</kbd><kbd>↓</kbd><p>选择匹配书签</p></div>
					<div><kbd>Enter</kbd><p>打开书签或搜索网页</p></div>
				</section>
			)}

			<footer>版本 {version} · 数据默认保留在本机</footer>
		</main>
	);
};

ReactDOM.createRoot(document.getElementById('popup-root')!).render(<Popup />);
