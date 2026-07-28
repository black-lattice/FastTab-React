import { useMemo, useState } from 'react';
import {
	Button,
	Checkbox,
	Dropdown,
	Empty,
	Input,
	Modal,
	Segmented,
	Space,
	Switch,
	message
} from 'antd';
import {
	DeleteOutlined,
	EyeInvisibleOutlined,
	EyeOutlined,
	FolderOpenOutlined,
	FolderOutlined,
	SearchOutlined
} from '@ant-design/icons';
import { Bookmark } from '../../types';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { useUIStore } from '../../store/uiStore';
import { useFavicon } from '../../hooks/useFavicon';

type DisplayFilter = 'all' | 'external' | 'internal';

const BookmarkFavicon: React.FC<{ bookmark: Bookmark }> = ({ bookmark }) => {
	const { faviconUrl } = useFavicon(bookmark.url);
	return faviconUrl ? (
		<img src={faviconUrl} alt='' className='h-9 w-9 rounded-lg object-contain' />
	) : (
		<div className='theme-preview-item flex h-9 w-9 items-center justify-center rounded-lg font-semibold'>
			{bookmark.title.trim().charAt(0).toUpperCase() || '🔗'}
		</div>
	);
};

const flattenFolders = (
	folders: Bookmark[],
	depth = 0
): { folder: Bookmark; depth: number }[] =>
	folders.flatMap(folder => [
		{ folder, depth },
		...flattenFolders(
			folder.children?.filter(child => !child.url) || [],
			depth + 1
		)
	]);

const BookmarkManagementModal: React.FC = () => {
	const {
		bookmarks,
		folders,
		externalBookmarkIds,
		removeBookmark,
		moveBookmark,
		setBookmarkExternal
	} = useBookmarkStore();
	const {
		isBookmarkManagerOpen,
		closeBookmarkManager,
		selectedBookmarkIds,
		setSelectedBookmarkIds
	} = useUIStore();
	const [searchText, setSearchText] = useState('');
	const [selectedFolderId, setSelectedFolderId] = useState('all');
	const [displayFilter, setDisplayFilter] = useState<DisplayFilter>('all');
	const flatFolders = useMemo(() => flattenFolders(folders), [folders]);

	const visibleBookmarks = useMemo(() => {
		const keyword = searchText.trim().toLowerCase();
		return bookmarks.filter(bookmark => {
			const matchesFolder =
				keyword || selectedFolderId === 'all'
					? true
					: bookmark.parentId === selectedFolderId;
			const isExternal = externalBookmarkIds.includes(bookmark.id);
			const matchesDisplay =
				displayFilter === 'all' ||
				(displayFilter === 'external' && isExternal) ||
				(displayFilter === 'internal' && !isExternal);
			const matchesSearch =
				!keyword ||
				bookmark.title.toLowerCase().includes(keyword) ||
				bookmark.url.toLowerCase().includes(keyword);
			return matchesFolder && matchesDisplay && matchesSearch;
		});
	}, [
		bookmarks,
		displayFilter,
		externalBookmarkIds,
		searchText,
		selectedFolderId
	]);

	const setExternalState = async (
		ids: string[],
		isExternal: boolean,
		clearSelection = true
	) => {
		try {
			for (const id of ids) await setBookmarkExternal(id, isExternal);
			message.success(isExternal ? '已显示在新标签页' : '已收回文件夹');
			if (clearSelection) setSelectedBookmarkIds([]);
		} catch {
			message.error('显示设置保存失败');
		}
	};

	const moveBookmarks = async (ids: string[], folderId: string) => {
		try {
			for (const id of ids) await moveBookmark(id, { parentId: folderId });
			message.success(`已移动 ${ids.length} 个书签`);
			setSelectedBookmarkIds([]);
		} catch {
			message.error('移动书签失败');
		}
	};

	const deleteSelected = () => {
		Modal.confirm({
			title: '删除选中的书签？',
			content: `将从浏览器收藏中删除 ${selectedBookmarkIds.length} 个书签，此操作无法撤销。`,
			okText: '删除',
			okType: 'danger',
			cancelText: '取消',
			onOk: async () => {
				for (const id of selectedBookmarkIds) await removeBookmark(id);
				setSelectedBookmarkIds([]);
				message.success('删除成功');
			}
		});
	};

	const moveItems = flatFolders.map(({ folder, depth }) => ({
		key: folder.id,
		label: `${'　'.repeat(depth)}${folder.title}`,
		icon: <FolderOutlined />
	}));
	const allVisibleSelected =
		visibleBookmarks.length > 0 &&
		visibleBookmarks.every(bookmark => selectedBookmarkIds.includes(bookmark.id));
	const visibleSelectedCount = visibleBookmarks.filter(bookmark =>
		selectedBookmarkIds.includes(bookmark.id)
	).length;

	return (
		<Modal
			className='bookmark-manager-modal bookmark-card-manager'
			title={
				<div className='flex items-start gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-500'><FolderOpenOutlined /></div>
					<div><div className='text-lg font-semibold'>书签管理</div><div className='mt-0.5 text-xs font-normal text-[var(--text-tertiary)]'>按文件夹浏览、外显或批量整理收藏</div></div>
				</div>
			}
			open={isBookmarkManagerOpen}
			onCancel={closeBookmarkManager}
			width={1040}
			centered
			footer={
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<span className='text-sm text-[var(--text-tertiary)]'>已选择 {selectedBookmarkIds.length} 项</span>
					<Space wrap>
						<Button icon={<EyeOutlined />} disabled={!selectedBookmarkIds.length} onClick={() => setExternalState(selectedBookmarkIds, true)}>外显</Button>
						<Button icon={<EyeInvisibleOutlined />} disabled={!selectedBookmarkIds.length} onClick={() => setExternalState(selectedBookmarkIds, false)}>收起</Button>
						<Dropdown menu={{ items: moveItems, onClick: ({ key }) => moveBookmarks(selectedBookmarkIds, key) }} disabled={!selectedBookmarkIds.length}><Button icon={<FolderOutlined />}>移动</Button></Dropdown>
						<Button danger icon={<DeleteOutlined />} disabled={!selectedBookmarkIds.length} onClick={deleteSelected}>删除</Button>
						<Button type='primary' onClick={closeBookmarkManager}>完成</Button>
					</Space>
				</div>
			}>
			<div className='bookmark-manager-toolbar mb-4 flex flex-wrap items-center gap-3 rounded-xl p-3'>
				<Input prefix={<SearchOutlined />} placeholder='搜索标题或网址' allowClear className='bookmark-manager-search min-w-56 flex-1' onChange={event => setSearchText(event.target.value)} />
				<Segmented value={displayFilter} onChange={value => setDisplayFilter(value as DisplayFilter)} options={[{ label: '全部', value: 'all' }, { label: `已外显 ${externalBookmarkIds.length}`, value: 'external' }, { label: '未外显', value: 'internal' }]} />
			</div>

			<div className='bookmark-manager-layout'>
				<aside className='bookmark-folder-sidebar'>
					<button className={`bookmark-folder-option ${selectedFolderId === 'all' ? 'is-active' : ''}`} onClick={() => setSelectedFolderId('all')}><FolderOpenOutlined /><span>全部书签</span><em>{bookmarks.length}</em></button>
					{flatFolders.map(({ folder, depth }) => (
						<button key={folder.id} className={`bookmark-folder-option ${selectedFolderId === folder.id ? 'is-active' : ''}`} style={{ paddingLeft: `${12 + depth * 14}px` }} onClick={() => setSelectedFolderId(folder.id)}><FolderOutlined /><span title={folder.title}>{folder.title}</span><em>{bookmarks.filter(bookmark => bookmark.parentId === folder.id).length}</em></button>
					))}
				</aside>

				<section className='bookmark-card-list'>
					<div className='mb-3 flex items-center justify-between'><Checkbox checked={allVisibleSelected} indeterminate={visibleSelectedCount > 0 && !allVisibleSelected} onChange={event => setSelectedBookmarkIds(event.target.checked ? visibleBookmarks.map(bookmark => bookmark.id) : [])}>选择当前结果</Checkbox><span className='text-xs text-[var(--text-tertiary)]'>{visibleBookmarks.length} 个书签</span></div>
					{visibleBookmarks.length ? <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>{visibleBookmarks.map(bookmark => {
						const checked = selectedBookmarkIds.includes(bookmark.id);
						return <article key={bookmark.id} className={`bookmark-manager-card ${checked ? 'is-selected' : ''}`}>
							<Checkbox checked={checked} onChange={event => setSelectedBookmarkIds(event.target.checked ? [...selectedBookmarkIds, bookmark.id] : selectedBookmarkIds.filter(id => id !== bookmark.id))} />
							<BookmarkFavicon bookmark={bookmark} />
							<a href={bookmark.url} className='min-w-0 flex-1' title={bookmark.title}><strong className='bookmark-card-title'>{bookmark.title}</strong><span className='bookmark-card-url'>{bookmark.url}</span></a>
							<Switch size='small' checked={externalBookmarkIds.includes(bookmark.id)} onChange={checkedState => setExternalState([bookmark.id], checkedState, false)} />
						</article>;
					})}</div> : <Empty description='没有符合条件的书签' className='mt-20' />}
				</section>
			</div>
		</Modal>
	);
};

export default BookmarkManagementModal;
