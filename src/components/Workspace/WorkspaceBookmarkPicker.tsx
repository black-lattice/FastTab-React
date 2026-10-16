import { useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { CheckCircleOutlined, FolderOutlined, SearchOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Checkbox, Input } from 'antd';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { flattenBookmarkFolders } from '../../utils/bookmarkTree';
import { filterWorkspaceBookmarks, updateWorkspaceSelection } from '../../utils/workspaceSelection';

interface WorkspaceBookmarkPickerProps {
	bookmarkIds: string[];
	folderIds: string[];
	onBookmarksChange: Dispatch<SetStateAction<string[]>>;
	onFoldersChange: Dispatch<SetStateAction<string[]>>;
}

export const WorkspaceBookmarkPicker = ({
	bookmarkIds, folderIds, onBookmarksChange, onFoldersChange
}: WorkspaceBookmarkPickerProps) => {
	const bookmarks = useBookmarkStore(state => state.bookmarks);
	const folders = useBookmarkStore(state => state.folders);
	const rootBookmarkIds = useBookmarkStore(state => state.rootBookmarkIds);
	const flatFolders = useMemo(() => flattenBookmarkFolders(folders), [folders]);
	const [category, setCategory] = useState(() => flatFolders[0]?.folder.id || 'root');
	const [query, setQuery] = useState('');
	const selected = useMemo(() => new Set(bookmarkIds), [bookmarkIds]);
	const folderMap = useMemo(() => new Map(flatFolders.map(({ folder }) => [folder.id, folder])), [flatFolders]);
	const counts = useMemo(() => {
		const result = new Map<string, { total: number; selected: number }>();
		for (const bookmark of bookmarks) {
			const key = bookmark.parentId || '';
			const count = result.get(key) || { total: 0, selected: 0 };
			count.total += 1;
			if (selected.has(bookmark.id)) count.selected += 1;
			result.set(key, count);
		}
		return result;
	}, [bookmarks, selected]);
	const currentFolder = folderMap.get(category);
	const currentCategory = currentFolder || ['all', 'root', 'selected'].includes(category) ? category : 'root';
	const visibleBookmarks = filterWorkspaceBookmarks(bookmarks, currentCategory, rootBookmarkIds, bookmarkIds, query);
	const selectedCount = bookmarks.filter(bookmark => selected.has(bookmark.id)).length;
	const selectedFolderCount = folderIds.filter(id => folderMap.has(id)).length;
	const checkedCount = visibleBookmarks.filter(bookmark => selected.has(bookmark.id)).length;
	const getFolderPath = (id?: string) => {
		const names: string[] = [];
		let folder = id ? folderMap.get(id) : undefined;
		while (folder) {
			names.unshift(folder.title || '未命名文件夹');
			folder = folder.parentId ? folderMap.get(folder.parentId) : undefined;
		}
		return names.join(' / ') || '书签栏';
	};
	const title = currentFolder ? getFolderPath(currentFolder.id) :
		currentCategory === 'all' ? '全部书签' : currentCategory === 'selected' ? '已选书签' : '书签栏';
	const selectCategory = (id: string) => {
		setCategory(id);
		setQuery('');
	};
	const categories = [
		{ id: 'all', title: '全部书签', count: bookmarks.length, icon: <UnorderedListOutlined /> },
		{ id: 'root', title: '书签栏', count: rootBookmarkIds.length, icon: <FolderOutlined /> },
		{ id: 'selected', title: '已选书签', count: selectedCount, icon: <CheckCircleOutlined /> }
	];

	return (
		<div className='workspace-picker'>
			<div className='workspace-picker-summary'>
				<span>按文件夹挑选书签</span>
				<span aria-live='polite'>已选 <strong>{selectedCount}</strong> 个书签 · <strong>{selectedFolderCount}</strong> 个文件夹</span>
			</div>
			<div className='workspace-picker-panels'>
				<nav className='workspace-picker-folders' aria-label='按文件夹筛选书签'>
					{categories.map(item => (
						<button key={item.id} type='button' className={`workspace-picker-category ${currentCategory === item.id ? 'is-active' : ''}`}
							aria-current={currentCategory === item.id ? 'true' : undefined} onClick={() => selectCategory(item.id)}>
							{item.icon}<span>{item.title}</span><small>{item.count}</small>
						</button>
					))}
					<div className='workspace-picker-caption'>文件夹分类</div>
					{flatFolders.map(({ folder, depth }) => {
						const count = counts.get(folder.id);
						return (
							<button key={folder.id} type='button' className={`workspace-picker-category ${currentCategory === folder.id ? 'is-active' : ''}`}
								style={{ paddingLeft: 12 + Math.min(depth, 6) * 12 }} title={getFolderPath(folder.id)}
								aria-current={currentCategory === folder.id ? 'true' : undefined} onClick={() => selectCategory(folder.id)}>
								<FolderOutlined /><span>{folder.title || '未命名文件夹'}</span>
								{folderIds.includes(folder.id) && <CheckCircleOutlined aria-label='已添加文件夹入口' />}
								<small>{count?.selected ? `${count.selected}/` : ''}{count?.total || 0}</small>
							</button>
						);
					})}
				</nav>
				<section className='workspace-picker-content' aria-label={`${title}中的书签`}>
					<div className='workspace-picker-heading'>
						<h3 title={title}>{title}</h3>
						{currentFolder && (
							<Checkbox checked={folderIds.includes(currentFolder.id)} onChange={event =>
								onFoldersChange(ids => updateWorkspaceSelection(ids, [currentFolder.id], event.target.checked))}>
								在工作区显示此文件夹入口
							</Checkbox>
						)}
						<Input prefix={<SearchOutlined />} value={query} onChange={event => setQuery(event.target.value)}
							placeholder='在当前分类搜索标题或网址' aria-label='搜索当前分类的书签' allowClear />
					</div>
					<div className='workspace-picker-selection'>
						<Checkbox checked={visibleBookmarks.length > 0 && checkedCount === visibleBookmarks.length}
							indeterminate={checkedCount > 0 && checkedCount < visibleBookmarks.length} disabled={!visibleBookmarks.length}
							onChange={event => onBookmarksChange(ids => updateWorkspaceSelection(ids, visibleBookmarks.map(item => item.id), event.target.checked))}>
							{query.trim() ? '全选搜索结果' : '全选当前分类'}
						</Checkbox>
						<span>{checkedCount} / {visibleBookmarks.length}</span>
					</div>
					<div className='workspace-picker-bookmarks'>
						{visibleBookmarks.map(bookmark => (
							<Checkbox key={bookmark.id} className={`workspace-picker-bookmark ${selected.has(bookmark.id) ? 'is-selected' : ''}`}
								checked={selected.has(bookmark.id)} onChange={event =>
									onBookmarksChange(ids => updateWorkspaceSelection(ids, [bookmark.id], event.target.checked))}>
								<span className='workspace-picker-bookmark-title' title={bookmark.title || bookmark.url}>{bookmark.title || bookmark.url}</span>
								<span className='workspace-picker-bookmark-detail' title={`${getFolderPath(bookmark.parentId)} · ${bookmark.url}`}>
									{['all', 'selected'].includes(currentCategory) ? `${getFolderPath(bookmark.parentId)} · ` : ''}{bookmark.url}
								</span>
							</Checkbox>
						))}
						{!visibleBookmarks.length && <div className='workspace-picker-empty'>
							<FolderOutlined />
							<p>{query.trim() ? '当前分类中没有匹配的书签' : currentCategory === 'selected' ? '还没有选择书签' : '当前分类没有直属书签'}</p>
							<span>{query.trim() ? '试试其他关键词，或切换到“全部书签”搜索' : '可在左侧选择其他文件夹或子文件夹'}</span>
						</div>}
					</div>
				</section>
			</div>
		</div>
	);
};
