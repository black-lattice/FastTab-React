import { AppstoreAddOutlined, HomeOutlined } from '@ant-design/icons';
import { useEffect, useRef } from 'react';
import { useUIStore } from '../../store/uiStore';
import { HOME_WORKSPACE_ID, useWorkspaceStore } from '../../store/workspaceStore';
import { WorkspaceManagerModal } from './WorkspaceManagerModal';

export const WorkspaceBar = () => {
	const workspaces = useWorkspaceStore(state => state.workspaces);
	const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId);
	const setActiveWorkspace = useWorkspaceStore(state => state.setActiveWorkspace);
	const openWorkspaceManager = useUIStore(state => state.openWorkspaceManager);
	const tabsRef = useRef<HTMLDivElement>(null);
	const options = [
		{ id: HOME_WORKSPACE_ID, name: '首页' },
		...workspaces
	];

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
								onClick={() => void setActiveWorkspace(option.id)}
								aria-current={activeWorkspaceId === option.id ? 'page' : undefined}>
								{option.id === HOME_WORKSPACE_ID && <HomeOutlined aria-hidden='true' />}
								<span>{option.name}</span>
							</button>
						))}
					</div>
					<span className='workspace-divider' aria-hidden='true' />
					<button
						type='button'
						className='workspace-manage-button'
						onClick={openWorkspaceManager}
						aria-label='创建或管理工作区'>
						<AppstoreAddOutlined aria-hidden='true' />
						<span>工作区</span>
					</button>
				</div>
			</nav>
			<WorkspaceManagerModal />
		</>
	);
};
