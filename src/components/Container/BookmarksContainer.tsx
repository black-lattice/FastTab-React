import React from 'react';
import { Bookmark } from '../../types';
import { BookmarkFolder } from '../Bookmark/BookmarkFolder';
import BookmarkCard from '../Bookmark/BookmarkCard';
import { EditModal } from '../UI/EditModal/EditModal';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { useUIStore } from '../../store/uiStore';
import { useLayoutStore } from '../../store/layoutStore';
import { HOME_WORKSPACE_ID, useWorkspaceStore } from '../../store/workspaceStore';
import { getWorkspaceContent } from '../../utils/workspaceContent';
import { useShallow } from 'zustand/react/shallow';

export const BookmarksContainer: React.FC = () => {
	const {
		folders,
		bookmarks,
		externalBookmarkIds,
		rootBookmarkIds,
		loading,
		error,
		permissionState,
		checkPermission,
		loadBookmarks,
		updateBookmark
	} = useBookmarkStore(useShallow(state => ({
		folders: state.folders,
		bookmarks: state.bookmarks,
		externalBookmarkIds: state.externalBookmarkIds,
		rootBookmarkIds: state.rootBookmarkIds,
		loading: state.loading,
		error: state.error,
		permissionState: state.permissionState,
		checkPermission: state.checkPermission,
		loadBookmarks: state.loadBookmarks,
		updateBookmark: state.updateBookmark
	})));

	const {
		isEditModalOpen,
		editingBookmark,
		closeEditModal,
		openAddBookmark
	} = useUIStore(useShallow(state => ({
		isEditModalOpen: state.isEditModalOpen,
		editingBookmark: state.editingBookmark,
		closeEditModal: state.closeEditModal,
		openAddBookmark: state.openAddBookmark
	})));
	const openWorkspaceManager = useUIStore(state => state.openWorkspaceManager);
	const folderPosition = useLayoutStore(state => state.settings.folderPosition);
	const workspaces = useWorkspaceStore(state => state.workspaces);
	const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId);
	const hiddenHomeFolderIds = useWorkspaceStore(state => state.hiddenHomeFolderIds);
	const activeWorkspace = activeWorkspaceId === HOME_WORKSPACE_ID
		? undefined
		: workspaces.find(workspace => workspace.id === activeWorkspaceId);
	const workspaceContent = getWorkspaceContent(
		bookmarks,
		folders,
		rootBookmarkIds,
		externalBookmarkIds,
		hiddenHomeFolderIds,
		activeWorkspace
	);
	const homeBookmarks = workspaceContent.bookmarks;
	const visibleFolders = workspaceContent.folders;

	const handleSave = async (changes: Partial<Bookmark>) => {
		if (editingBookmark) {
			await updateBookmark(editingBookmark.id, changes);
			closeEditModal();
		}
	};
	const retryLoading = async () => {
		const hasPermission = await checkPermission();
		if (hasPermission) await loadBookmarks();
	};
	const openExtensionSettings = () => {
		void chrome.tabs.create({
			url: `chrome://extensions/?id=${chrome.runtime.id}`
		});
	};
	const bookmarkCards = homeBookmarks.map(bookmark => (
		<BookmarkCard key={bookmark.id} bookmark={bookmark} />
	));
	const folderCards = visibleFolders.map((folder: Bookmark) => (
		<BookmarkFolder
			key={folder.id}
			folder={folder}
			hiddenBookmarkIds={externalBookmarkIds}
		/>
	));

	if (!permissionState.hasPermission) {
		return (
			<div className='text-center p-4 text-[var(--text-primary)] max-w-md mx-auto'>
				<h2 className='text-3xl mb-4'>欢迎使用 FastTab</h2>
					<p className='text-base mb-5 text-[var(--text-secondary)] leading-relaxed'>
						FastTab 需要已在安装时声明的书签权限；数据只在本机读取和整理
					</p>
					<div className='flex flex-wrap justify-center gap-2'>
						<button
							className='theme-glass min-h-11 border-2 text-[var(--text-primary)] px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-60'
							onClick={() => void retryLoading()}
							disabled={permissionState.isChecking}>
							{permissionState.isChecking ? '检查中…' : '重新检查'}
						</button>
						<button
							className='theme-secondary-button min-h-11 rounded-lg px-4 py-2 text-sm cursor-pointer'
							onClick={openExtensionSettings}>
							打开扩展设置
						</button>
					</div>
				</div>
			);
		}

	if (error) {
		return (
			<div className='theme-panel mx-auto max-w-md rounded-2xl p-6 text-center'>
				<h2 className='mb-2 text-xl font-semibold'>暂时无法读取书签</h2>
				<p className='mb-5 text-sm leading-relaxed text-[var(--text-secondary)]'>{error}</p>
				<button
					type='button'
					className='min-h-11 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60'
					onClick={() => void retryLoading()}
					disabled={loading}>
					{loading ? '重试中…' : '重新加载'}
				</button>
			</div>
		);
	}

	if (loading) {
		return (
			<div className='flex flex-col items-center justify-center p-4 text-[var(--text-primary)]'>
				<div className='w-10 h-10 border-4 border-[var(--border-color)] border-t-[var(--text-primary)] rounded-full animate-spin mb-4'></div>
				<p className='text-base text-[var(--text-secondary)]'>正在加载书签...</p>
			</div>
		);
	}

	if (visibleFolders.length === 0 && homeBookmarks.length === 0) {
			return (
				<div className='text-center p-4 text-[var(--text-primary)]'>
					<h3 className='text-2xl mb-2.5'>{activeWorkspace ? '这个工作区还是空的' : '暂无书签'}</h3>
					<p className='mb-5 text-base text-[var(--text-secondary)] leading-relaxed'>
						{activeWorkspace ? '选择要在这里显示的书签或文件夹' : '添加一个常用网址，开始搭建你的新标签页'}
					</p>
					<button
					type='button'
					className='min-h-11 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
						onClick={activeWorkspace ? openWorkspaceManager : openAddBookmark}>
						{activeWorkspace ? '配置工作区' : '添加第一个书签'}
				</button>
			</div>
		);
	}

	return (
		<>
			<main className='w-full flex flex-col items-center'>
				<section className='w-full mb-1.5'>
						<div className='bookmark-grid bookmark-home-grid grid w-full'>
							{folderPosition === 'folders-first' ? folderCards : bookmarkCards}
							{folderPosition === 'folders-first' ? bookmarkCards : folderCards}
						</div>
				</section>
			</main>

			<EditModal
				isOpen={isEditModalOpen}
				bookmark={editingBookmark}
				onSave={handleSave}
				onCancel={closeEditModal}
			/>
		</>
	);
};
