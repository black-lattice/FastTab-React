import React, { lazy, Suspense, useEffect } from 'react';
import { Button, Tooltip } from 'antd';
import { PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { useUIStore } from '../../store/uiStore';
import { useShallow } from 'zustand/react/shallow';

const AddBookmarkModal = lazy(() => import('./AddBookmarkModal'));
const loadBookmarkManagementModal = () => import('./BookmarkManagementModal');
const BookmarkManagementModal = lazy(loadBookmarkManagementModal);

/**
 * 书签管理面板组件
 * 提供书签的批量管理和操作功能
 */
const BookmarkManager: React.FC = () => {
	const {
		isAddBookmarkOpen,
		isBookmarkManagerOpen,
		openBookmarkManager,
		openAddBookmark
	} = useUIStore(useShallow(state => ({
		isAddBookmarkOpen: state.isAddBookmarkOpen,
		isBookmarkManagerOpen: state.isBookmarkManagerOpen,
		openBookmarkManager: state.openBookmarkManager,
		openAddBookmark: state.openAddBookmark
	})));
	const hasPermission = useBookmarkStore(
		state => state.permissionState.hasPermission
	);

	useEffect(() => {
		if (!hasPermission) return;
		const idleWindow = window as unknown as {
			requestIdleCallback?: Window['requestIdleCallback'];
			cancelIdleCallback?: Window['cancelIdleCallback'];
		};
		if (idleWindow.requestIdleCallback) {
			const idleId = idleWindow.requestIdleCallback(
				() => void loadBookmarkManagementModal(),
				{ timeout: 2000 }
			);
			return () => idleWindow.cancelIdleCallback?.(idleId);
		}
		const timer = window.setTimeout(() => void loadBookmarkManagementModal(), 800);
		return () => window.clearTimeout(timer);
	}, [hasPermission]);

	return (
		<div className='fixed right-5 bottom-20 z-40 flex flex-col gap-3'>
			<Tooltip title='添加书签' placement='left'>
				<Button
					className='quick-action-button'
					type='default'
					shape='circle'
					icon={<PlusOutlined />}
					onClick={openAddBookmark}
					disabled={!hasPermission}
					aria-label='添加书签'
				/>
			</Tooltip>
			<Tooltip title='管理书签' placement='left'>
				<Button
					className='quick-action-button'
					type='default'
					shape='circle'
					icon={<SettingOutlined />}
					onClick={openBookmarkManager}
					disabled={!hasPermission}
					aria-label='管理书签'
				/>
			</Tooltip>

			{isAddBookmarkOpen && (
				<Suspense fallback={null}>
					<AddBookmarkModal />
				</Suspense>
			)}
			{isBookmarkManagerOpen && (
				<Suspense fallback={null}>
					<BookmarkManagementModal />
				</Suspense>
			)}
		</div>
	);
};

export default BookmarkManager;
