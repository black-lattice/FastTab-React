import { useMemo } from 'react';
import { message } from 'antd';
import {
	BgColorsOutlined,
	ControlOutlined,
	PlusOutlined,
	SettingOutlined
} from '@ant-design/icons';
import { useBackgroundStore } from '../../../store/backgroundStore';
import { useUIStore } from '../../../store/uiStore';

export interface SearchCommand {
	id: string;
	title: string;
	description: string;
	keywords: string;
	icon: React.ReactNode;
	execute: () => void | Promise<void>;
}

export const useSearchCommands = (): SearchCommand[] => {
	const openAddBookmark = useUIStore(state => state.openAddBookmark);
	const openBookmarkManager = useUIStore(state => state.openBookmarkManager);
	const openAppearanceSettings = useUIStore(state => state.openAppearanceSettings);
	const openWorkspaceManager = useUIStore(state => state.openWorkspaceManager);
	const backgroundSettings = useBackgroundStore(state => state.settings);
	const saveBackgroundSettings = useBackgroundStore(state => state.saveSettings);

	return useMemo(() => [
		{
			id: 'add-bookmark',
			title: '添加书签',
			description: '保存一个常用网址',
			keywords: '添加 新建 书签 add bookmark',
			icon: <PlusOutlined />,
			execute: openAddBookmark
		},
		{
			id: 'manage-bookmarks',
			title: '管理书签',
			description: '搜索、移动或批量整理',
			keywords: '管理 整理 移动 删除 manage bookmark',
			icon: <SettingOutlined />,
			execute: openBookmarkManager
		},
		{
			id: 'manage-workspaces',
			title: '管理工作区',
			description: '创建或配置首页分组',
			keywords: '工作区 分组 空间 workspace group',
			icon: <ControlOutlined />,
			execute: openWorkspaceManager
		},
		{
			id: 'appearance',
			title: '外观与布局',
			description: '调整主题、背景和图标大小',
			keywords: '外观 布局 图标 背景 设置 appearance layout',
			icon: <ControlOutlined />,
			execute: openAppearanceSettings
		},
		{
			id: 'toggle-theme',
			title: backgroundSettings.themeMode === 'dark' ? '切换到浅色主题' : '切换到深色主题',
			description: '立即切换页面明暗模式',
			keywords: '主题 深色 浅色 dark light theme',
			icon: <BgColorsOutlined />,
			execute: async () => {
				const themeMode = backgroundSettings.themeMode === 'dark' ? 'light' : 'dark';
				await saveBackgroundSettings({ ...backgroundSettings, themeMode });
				message.success(themeMode === 'dark' ? '已切换到深色主题' : '已切换到浅色主题');
			}
		}
	], [
		backgroundSettings,
		openAddBookmark,
		openAppearanceSettings,
		openBookmarkManager,
		openWorkspaceManager,
		saveBackgroundSettings
	]);
};
