import { useDeferredValue, useMemo, useState } from 'react';
import {
	Button,
	Dropdown,
	Modal,
	Space,
	message
} from 'antd';
import {
	DeleteOutlined,
	EyeInvisibleOutlined,
	EyeOutlined,
	FolderOutlined
} from '@ant-design/icons';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { useUIStore } from '../../store/uiStore';
import { flattenBookmarkFolders } from '../../utils/bookmarkTree';
import { BookmarkCleanupModal } from './BookmarkCleanupModal';
import {
	BookmarkFolderSidebar,
	BookmarkManagerHeader,
	BookmarkManagerToolbar
} from './BookmarkManagementParts';
import type { BookmarkDisplayFilter } from './BookmarkManagementParts';
import { useShallow } from 'zustand/react/shallow';
import { BookmarkWorkspaceTabs } from './BookmarkWorkspaceTabs';
import { BookmarkManagerList } from './BookmarkManagerList';
import { useBookmarkWorkspace } from './useBookmarkWorkspace';

const BookmarkManagementModal: React.FC = () => {
	const {
		bookmarks,
		folders,
		removeBookmarks,
		moveBookmarks
	} = useBookmarkStore(useShallow(state => ({
		bookmarks: state.bookmarks,
		folders: state.folders,
		removeBookmarks: state.removeBookmarks,
		moveBookmarks: state.moveBookmarks
	})));
	const {
		isBookmarkManagerOpen,
		closeBookmarkManager,
		selectedBookmarkIds,
		setSelectedBookmarkIds
	} = useUIStore(useShallow(state => ({
		isBookmarkManagerOpen: state.isBookmarkManagerOpen,
		closeBookmarkManager: state.closeBookmarkManager,
		selectedBookmarkIds: state.selectedBookmarkIds,
		setSelectedBookmarkIds: state.setSelectedBookmarkIds
	})));
	const [searchText, setSearchText] = useState('');
	const [selectedFolderId, setSelectedFolderId] = useState('all');
	const [displayFilter, setDisplayFilter] = useState<BookmarkDisplayFilter>('all');
	const [isCleanupOpen, setIsCleanupOpen] = useState(false);
	const workspace = useBookmarkWorkspace();
	const deferredSearchText = useDeferredValue(searchText.trim().toLowerCase());
	const flatFolders = useMemo(() => flattenBookmarkFolders(folders), [folders]);
	const folderCounts = useMemo(() => {
		const counts = new Map<string, number>();
		for (const bookmark of bookmarks) {
			if (bookmark.parentId) {
				counts.set(bookmark.parentId, (counts.get(bookmark.parentId) || 0) + 1);
			}
		}
		return counts;
	}, [bookmarks]);

	const visibleBookmarks = useMemo(() => {
		return bookmarks.filter(bookmark => {
			const matchesFolder =
				deferredSearchText || selectedFolderId === 'all'
					? true
					: bookmark.parentId === selectedFolderId;
			const isIncluded = workspace.bookmarkIds.has(bookmark.id);
			const matchesDisplay =
				displayFilter === 'all' ||
				(displayFilter === 'external' && isIncluded) ||
				(displayFilter === 'internal' && !isIncluded);
			const matchesSearch =
				!deferredSearchText ||
				bookmark.title.toLowerCase().includes(deferredSearchText) ||
				bookmark.url.toLowerCase().includes(deferredSearchText);
			return matchesFolder && matchesDisplay && matchesSearch;
		});
	}, [
		bookmarks,
		deferredSearchText,
		displayFilter,
		workspace.bookmarkIds,
		selectedFolderId
	]);
	const selectWorkspace = (id: string) => {
		workspace.setWorkspaceId(id);
		setSelectedBookmarkIds([]);
		setDisplayFilter('all');
		setSelectedFolderId('all');
		setSearchText('');
	};
	const setIncludedState = async (ids: string[], included: boolean, clearSelection = true) => {
		if (await workspace.setIncluded('bookmarkIds', ids, included) && clearSelection) {
			setSelectedBookmarkIds([]);
		}
	};
	const moveSelectedBookmarks = async (folderId: string) => {
		try {
			await moveBookmarks(selectedBookmarkIds, { parentId: folderId });
			message.success(`已移动 ${selectedBookmarkIds.length} 个书签`);
			setSelectedBookmarkIds([]);
		} catch {
			message.error('移动书签失败');
		}
	};
	const deleteSelected = () => {
		Modal.confirm({
			title: '从浏览器删除选中的书签？',
			content: `将从浏览器书签中删除 ${selectedBookmarkIds.length} 项，同时影响所有工作区；删除后可在页面底部短暂撤销。`,
			okText: '删除',
			okButtonProps: { danger: true },
			cancelText: '取消',
			onOk: async () => {
				try {
					await removeBookmarks(selectedBookmarkIds);
					setSelectedBookmarkIds([]);
					message.success('删除成功');
				} catch {
					message.error('部分书签删除失败，请刷新后重试');
				}
			}
		});
	};

	const moveItems = useMemo(
		() => flatFolders.map(({ folder, depth }) => ({
			key: folder.id,
			label: `${'　'.repeat(depth)}${folder.title}`,
			icon: <FolderOutlined />
		})),
		[flatFolders]
	);

	return (
		<>
			<Modal
				className='bookmark-manager-modal bookmark-card-manager'
				title={<BookmarkManagerHeader />}
				open={isBookmarkManagerOpen}
			onCancel={closeBookmarkManager}
			width={1040}
			centered
			footer={
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<span className='text-sm text-[var(--text-tertiary)]'>
						已选择 {selectedBookmarkIds.length} 项 · 当前可见 {visibleBookmarks.filter(item => selectedBookmarkIds.includes(item.id)).length} 项
					</span>
					<Space wrap>
						<Button
							icon={<EyeOutlined />}
							disabled={!selectedBookmarkIds.length || workspace.saving || !workspace.workspace}
							onClick={() => void setIncludedState(selectedBookmarkIds, true)}>
							批量加入
						</Button>
						<Button
							icon={<EyeInvisibleOutlined />}
							disabled={!selectedBookmarkIds.length || workspace.saving || !workspace.workspace}
							onClick={() => void setIncludedState(selectedBookmarkIds, false)}>
							批量移除
						</Button>
						<Dropdown
							menu={{
								items: moveItems,
								onClick: ({ key }) => void moveSelectedBookmarks(key)
							}}
							disabled={!selectedBookmarkIds.length || !moveItems.length}>
							<Button icon={<FolderOutlined />}>移动</Button>
						</Dropdown>
						<Button
							danger
							icon={<DeleteOutlined />}
							disabled={!selectedBookmarkIds.length || workspace.saving}
							onClick={deleteSelected}>
							删除
						</Button>
						<Button type='primary' onClick={closeBookmarkManager}>完成</Button>
					</Space>
				</div>
			}>
				<BookmarkWorkspaceTabs value={workspace.workspaceId} onChange={selectWorkspace}
					disabled={workspace.saving || !workspace.isMigrated} />
				<BookmarkManagerToolbar
					searchText={searchText}
					displayFilter={displayFilter}
					includedCount={bookmarks.filter(item => workspace.bookmarkIds.has(item.id)).length}
					onSearchChange={setSearchText}
					onFilterChange={setDisplayFilter}
					onCleanup={() => setIsCleanupOpen(true)}
				/>

				<div className='bookmark-manager-layout'>
					<BookmarkFolderSidebar
						folders={flatFolders}
						folderCounts={folderCounts}
						selectedFolderId={selectedFolderId}
						totalCount={bookmarks.length}
						onSelect={setSelectedFolderId}
						includedFolderIds={workspace.folderIds}
						workspaceName={workspace.workspace?.name || '工作区'}
						disabled={!workspace.workspace || workspace.saving || !workspace.isMigrated}
						onIncludedChange={(id, included) => void workspace.setIncluded('folderIds', [id], included)}
					/>

				<BookmarkManagerList
					resetKey={[workspace.workspaceId, deferredSearchText, displayFilter, selectedFolderId].join('|')}
					visibleBookmarks={visibleBookmarks}
					selectedBookmarkIds={selectedBookmarkIds}
					setSelectedBookmarkIds={setSelectedBookmarkIds}
					includedIds={workspace.bookmarkIds}
					workspaceName={workspace.workspace?.name || '工作区'}
					disabled={!workspace.workspace || workspace.saving || !workspace.isMigrated}
					onIncludedChange={(id, included) => void setIncludedState([id], included, false)}
				/>
			</div>
			</Modal>
			<BookmarkCleanupModal open={isCleanupOpen} onClose={() => setIsCleanupOpen(false)} />
		</>
	);
};

export default BookmarkManagementModal;
