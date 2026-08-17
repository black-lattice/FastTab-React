import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
	Button,
	Checkbox,
	Dropdown,
	Empty,
	Modal,
	Space,
	Switch,
	Tooltip,
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
	BookmarkFavicon,
	BookmarkFolderSidebar,
	BookmarkManagerHeader,
	BookmarkManagerToolbar
} from './BookmarkManagementParts';
import type { BookmarkDisplayFilter } from './BookmarkManagementParts';
import { useShallow } from 'zustand/react/shallow';

const BOOKMARK_RENDER_BATCH_SIZE = 20;

const BookmarkManagementModal: React.FC = () => {
	const {
		bookmarks,
		folders,
		rootBookmarkIds,
		externalBookmarkIds,
		removeBookmarks,
		moveBookmarks,
		setBookmarksExternal
	} = useBookmarkStore(useShallow(state => ({
		bookmarks: state.bookmarks,
		folders: state.folders,
		rootBookmarkIds: state.rootBookmarkIds,
		externalBookmarkIds: state.externalBookmarkIds,
		removeBookmarks: state.removeBookmarks,
		moveBookmarks: state.moveBookmarks,
		setBookmarksExternal: state.setBookmarksExternal
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
	const [renderLimit, setRenderLimit] = useState(BOOKMARK_RENDER_BATCH_SIZE);
	const listRef = useRef<HTMLElement>(null);
	const deferredSearchText = useDeferredValue(searchText.trim().toLowerCase());
	const flatFolders = useMemo(() => flattenBookmarkFolders(folders), [folders]);
	const rootBookmarkIdSet = useMemo(() => new Set(rootBookmarkIds), [rootBookmarkIds]);
	const homeBookmarkIdSet = useMemo(
		() => new Set([...rootBookmarkIds, ...externalBookmarkIds]),
		[rootBookmarkIds, externalBookmarkIds]
	);
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
			const isVisibleOnHome = homeBookmarkIdSet.has(bookmark.id);
			const matchesDisplay =
				displayFilter === 'all' ||
				(displayFilter === 'external' && isVisibleOnHome) ||
				(displayFilter === 'internal' && !isVisibleOnHome);
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
		homeBookmarkIdSet,
		selectedFolderId
	]);
	const renderedBookmarks = useMemo(
		() => visibleBookmarks.slice(0, renderLimit),
		[renderLimit, visibleBookmarks]
	);
	const selectedBookmarkIdSet = useMemo(
		() => new Set(selectedBookmarkIds),
		[selectedBookmarkIds]
	);

	useEffect(() => {
		setRenderLimit(BOOKMARK_RENDER_BATCH_SIZE);
		listRef.current?.scrollTo({ top: 0 });
	}, [deferredSearchText, displayFilter, selectedFolderId]);

	const setExternalState = async (
		ids: string[],
		isExternal: boolean,
		clearSelection = true
	) => {
		const editableIds = ids.filter(id => !rootBookmarkIdSet.has(id));
		if (!editableIds.length) {
			message.info('书签栏根目录项目会固定显示在首页');
			return;
		}
		try {
			await setBookmarksExternal(editableIds, isExternal);
			message.success(isExternal ? '已显示在首页' : '已从首页收起');
			if (clearSelection) setSelectedBookmarkIds([]);
		} catch {
			message.error('首页显示设置保存失败');
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
			title: '删除选中的书签？',
			content: `将从浏览器书签中删除 ${selectedBookmarkIds.length} 项，删除后可在页面底部短暂撤销。`,
			okText: '删除',
			okType: 'danger',
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
	const allVisibleSelected =
		visibleBookmarks.length > 0 &&
		visibleBookmarks.every(bookmark => selectedBookmarkIdSet.has(bookmark.id));
	const visibleSelectedCount = visibleBookmarks.filter(bookmark =>
		selectedBookmarkIdSet.has(bookmark.id)
	).length;
	const handleListScroll = (event: React.UIEvent<HTMLElement>) => {
		const list = event.currentTarget;
		if (
			renderLimit < visibleBookmarks.length &&
			list.scrollHeight - list.scrollTop - list.clientHeight < 240
		) {
			setRenderLimit(current => Math.min(
				current + BOOKMARK_RENDER_BATCH_SIZE,
				visibleBookmarks.length
			));
		}
	};

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
						已选择 {selectedBookmarkIds.length} 项
					</span>
					<Space wrap>
						<Button
							icon={<EyeOutlined />}
							disabled={!selectedBookmarkIds.length}
							onClick={() => void setExternalState(selectedBookmarkIds, true)}>
							显示在首页
						</Button>
						<Button
							icon={<EyeInvisibleOutlined />}
							disabled={!selectedBookmarkIds.length}
							onClick={() => void setExternalState(selectedBookmarkIds, false)}>
							从首页收起
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
							disabled={!selectedBookmarkIds.length}
							onClick={deleteSelected}>
							删除
						</Button>
						<Button type='primary' onClick={closeBookmarkManager}>完成</Button>
					</Space>
				</div>
			}>
				<BookmarkManagerToolbar
					searchText={searchText}
					displayFilter={displayFilter}
					homeCount={homeBookmarkIdSet.size}
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
					/>

				<section
					ref={listRef}
					className='bookmark-card-list'
					aria-label='书签列表'
					onScroll={handleListScroll}>
					<div className='mb-3 flex items-center justify-between'>
						<Checkbox
							checked={allVisibleSelected}
							indeterminate={visibleSelectedCount > 0 && !allVisibleSelected}
							onChange={event =>
								setSelectedBookmarkIds(
									event.target.checked
										? visibleBookmarks.map(bookmark => bookmark.id)
										: []
								)
							}>
							选择当前结果
						</Checkbox>
						<span className='text-xs text-[var(--text-tertiary)]'>
							{visibleBookmarks.length} 个书签
						</span>
					</div>

					{visibleBookmarks.length ? (
						<div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
							{renderedBookmarks.map(bookmark => {
								const checked = selectedBookmarkIdSet.has(bookmark.id);
								const isRootBookmark = rootBookmarkIdSet.has(bookmark.id);
								return (
									<article
										key={bookmark.id}
										className={`bookmark-manager-card ${checked ? 'is-selected' : ''}`}>
										<Checkbox
											checked={checked}
											aria-label={`选择 ${bookmark.title}`}
											onChange={event =>
												setSelectedBookmarkIds(
													event.target.checked
														? [...selectedBookmarkIds, bookmark.id]
														: selectedBookmarkIds.filter(id => id !== bookmark.id)
												)
											}
										/>
										<BookmarkFavicon bookmark={bookmark} />
										<a href={bookmark.url} className='min-w-0 flex-1' title={bookmark.title}>
											<strong className='bookmark-card-title'>{bookmark.title}</strong>
											<span className='bookmark-card-url'>{bookmark.url}</span>
										</a>
										<Tooltip title={isRootBookmark ? '书签栏根目录项目固定显示' : '是否显示在首页'}>
											<Switch
												size='small'
												checked={homeBookmarkIdSet.has(bookmark.id)}
												disabled={isRootBookmark}
												onChange={checkedState =>
													void setExternalState([bookmark.id], checkedState, false)
												}
												aria-label={`${bookmark.title} 首页显示`}
											/>
										</Tooltip>
									</article>
								);
							})}
							{renderedBookmarks.length < visibleBookmarks.length && (
								<button
									type='button'
									className='bookmark-manager-load-more col-span-full'
									onClick={() => setRenderLimit(current => Math.min(
										current + BOOKMARK_RENDER_BATCH_SIZE,
										visibleBookmarks.length
									))}>
									继续显示（剩余 {visibleBookmarks.length - renderedBookmarks.length} 项）
								</button>
							)}
						</div>
					) : (
						<Empty description='没有符合条件的书签' className='mt-20' />
					)}
				</section>
			</div>
			</Modal>
			<BookmarkCleanupModal open={isCleanupOpen} onClose={() => setIsCleanupOpen(false)} />
		</>
	);
};

export default BookmarkManagementModal;
