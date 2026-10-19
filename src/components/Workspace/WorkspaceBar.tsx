import { HomeOutlined } from '@ant-design/icons';
import { useEffect, useRef } from 'react';
import { message } from 'antd';
import { HOME_WORKSPACE_ID, useWorkspaceStore } from '../../store/workspaceStore';

export const WorkspaceBar = () => {
	const workspaces = useWorkspaceStore(state => state.workspaces);
	const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId);
	const setActiveWorkspace = useWorkspaceStore(state => state.setActiveWorkspace);
	const tabsRef = useRef<HTMLDivElement>(null);
	const options = workspaces;

	useEffect(() => {
		const tabs = tabsRef.current;
		const activeTab = tabs?.querySelector<HTMLElement>('[aria-current="page"]');
		if (!tabs || !activeTab) return;
		const activeStart = activeTab.offsetLeft;
		const activeEnd = activeStart + activeTab.offsetWidth;
		if (activeStart < tabs.scrollLeft) tabs.scrollLeft = activeStart;
		if (activeEnd > tabs.scrollLeft + tabs.clientWidth) {
			tabs.scrollLeft = activeEnd - tabs.clientWidth;
		}
	}, [activeWorkspaceId, workspaces.length]);

	if (!options.length) return null;

	return (
		<>
			<nav className='workspace-bar' aria-label='首页工作区'>
				<div className='workspace-switcher'>
					<div ref={tabsRef} className='workspace-tabs'>
						{options.map(option => (
							<button
								key={option.id}
								type='button'
								className={`workspace-tab ${activeWorkspaceId === option.id ? 'is-active' : ''}`}
								onClick={() => void setActiveWorkspace(option.id).catch(() => message.error('切换工作区失败'))}
								aria-current={activeWorkspaceId === option.id ? 'page' : undefined}>
								{option.id === HOME_WORKSPACE_ID && <HomeOutlined aria-hidden='true' />}
								<span>{option.name}</span>
							</button>
						))}
					</div>
				</div>
			</nav>
		</>
	);
};
