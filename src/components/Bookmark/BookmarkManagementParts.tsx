import {
	ClearOutlined,
	EyeInvisibleOutlined,
	EyeOutlined,
	FolderOpenOutlined,
	FolderOutlined,
	SearchOutlined
} from '@ant-design/icons';
import { Button, Input, Segmented, Tooltip } from 'antd';
import type { Bookmark } from '../../types';
import type { FlatBookmarkFolder } from '../../utils/bookmarkTree';
import { useFavicon } from '../../hooks/useFavicon';

export type BookmarkDisplayFilter = 'all' | 'external' | 'internal';

export const BookmarkFavicon = ({ bookmark }: { bookmark: Bookmark }) => {
	const { faviconUrl, handleFaviconLoad, handleFaviconError } = useFavicon(bookmark.url);
	return faviconUrl ? (
		<img
			src={faviconUrl}
			alt=''
			loading='lazy'
			decoding='async'
			onLoad={handleFaviconLoad}
			onError={handleFaviconError}
			className='bookmark-favicon-image h-9 w-9 rounded-lg object-contain'
		/>
	) : (
		<div className='theme-preview-item flex h-9 w-9 items-center justify-center rounded-lg font-semibold'>
			{bookmark.title.trim().charAt(0).toUpperCase() || '•'}
		</div>
	);
};

export const BookmarkManagerHeader = () => (
	<div className='flex items-start gap-3'>
		<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-500'>
			<FolderOpenOutlined />
		</div>
		<div>
			<div className='text-lg font-semibold'>书签管理</div>
			<div className='mt-0.5 text-xs font-normal text-[var(--text-tertiary)]'>
				搜索、加入工作区或批量整理收藏
			</div>
		</div>
	</div>
);

interface BookmarkManagerToolbarProps {
	searchText: string;
	displayFilter: BookmarkDisplayFilter;
	includedCount: number;
	onSearchChange: (value: string) => void;
	onFilterChange: (value: BookmarkDisplayFilter) => void;
	onCleanup: () => void;
}

export const BookmarkManagerToolbar = ({
	searchText,
	displayFilter,
	includedCount,
	onSearchChange,
	onFilterChange,
	onCleanup
}: BookmarkManagerToolbarProps) => (
	<div className='bookmark-manager-toolbar mb-4 flex flex-wrap items-center gap-3 rounded-xl p-3'>
		<Input
			prefix={<SearchOutlined />}
			placeholder='搜索标题或网址'
			allowClear
			className='bookmark-manager-search min-w-56 flex-1'
			value={searchText}
			onChange={event => onSearchChange(event.target.value)}
		/>
		<Segmented
			value={displayFilter}
			onChange={value => onFilterChange(value as BookmarkDisplayFilter)}
			options={[
				{ label: '全部', value: 'all' },
				{ label: `已加入 ${includedCount}`, value: 'external' },
				{ label: '未加入', value: 'internal' }
			]}
		/>
		<Button icon={<ClearOutlined />} onClick={onCleanup}>整理书签</Button>
	</div>
);

interface BookmarkFolderSidebarProps {
	folders: FlatBookmarkFolder[];
	folderCounts: Map<string, number>;
	selectedFolderId: string;
	totalCount: number;
	onSelect: (id: string) => void;
	includedFolderIds: Set<string>;
	workspaceName: string;
	disabled: boolean;
	onIncludedChange: (id: string, included: boolean) => void;
}

export const BookmarkFolderSidebar = ({
	folders,
	folderCounts,
	selectedFolderId,
	totalCount,
	onSelect,
	includedFolderIds,
	workspaceName,
	disabled,
	onIncludedChange
}: BookmarkFolderSidebarProps) => {
	return (
		<aside className='bookmark-folder-sidebar' aria-label='书签文件夹'>
			<button
				type='button'
				className={`bookmark-folder-option ${selectedFolderId === 'all' ? 'is-active' : ''}`}
				onClick={() => onSelect('all')}>
				<FolderOpenOutlined />
				<span className='bookmark-folder-name'>全部书签</span>
				<em>{totalCount}</em>
			</button>
			{folders.map(({ folder, depth }) => {
				const included = includedFolderIds.has(folder.id);
				return (
					<div
						key={folder.id}
						className={`bookmark-folder-option ${selectedFolderId === folder.id ? 'is-active' : ''}`}>
						<button
							type='button'
							className='bookmark-folder-select'
							style={{ paddingLeft: `${12 + depth * 14}px` }}
							onClick={() => onSelect(folder.id)}>
							<FolderOutlined />
							<span className='bookmark-folder-name' title={folder.title}>{folder.title}</span>
							<em>{folderCounts.get(folder.id) || 0}</em>
						</button>
							<Tooltip title={`${included ? '移除' : '加入'}“${workspaceName}”的文件夹入口`}>
								<button
									type='button'
									className={`bookmark-folder-visibility ${included ? '' : 'is-hidden'}`}
									disabled={disabled}
									onClick={() => onIncludedChange(folder.id, !included)}
									aria-label={`${folder.title} ${workspaceName}文件夹入口`}
									aria-pressed={included}>
									{included ? <EyeOutlined /> : <EyeInvisibleOutlined />}
								</button>
							</Tooltip>
					</div>
				);
			})}
		</aside>
	);
};
