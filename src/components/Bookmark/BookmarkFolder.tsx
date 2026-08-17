import { useMemo, useState } from 'react';
import { Button, Modal, message } from 'antd';
import {
	ArrowLeftOutlined,
	FolderOpenOutlined,
	LinkOutlined
} from '@ant-design/icons';
import { Bookmark } from '../../types';
import { useFavicon } from '../../hooks/useFavicon';
import {
	collectBookmarks,
	findBookmarkFolderPath
} from '../../utils/bookmarkTree';
import BookmarkCard from './BookmarkCard';

interface BookmarkFolderProps {
	folder: Bookmark;
	hiddenBookmarkIds?: string[];
}

const FolderPreviewItem: React.FC<{ bookmark: Bookmark }> = ({ bookmark }) => {
	const { faviconUrl, handleFaviconLoad, handleFaviconError } = useFavicon(bookmark.url);

	return (
		<div className='theme-preview-item flex items-center justify-center overflow-hidden rounded-sm text-[10px] font-semibold'>
			{faviconUrl ? (
				<img
					className='bookmark-favicon-image h-full w-full object-contain'
				src={faviconUrl}
				alt=''
				loading='lazy'
				decoding='async'
				onLoad={handleFaviconLoad}
				onError={handleFaviconError}
				/>
			) : (
				bookmark.title.trim().charAt(0).toUpperCase() || <LinkOutlined />
			)}
		</div>
	);
};

const FolderTile = ({
	folder,
	hiddenIds,
	onOpen
}: {
	folder: Bookmark;
	hiddenIds: Set<string>;
	onOpen: () => void;
}) => {
	const previewBookmarks = collectBookmarks(folder.children || [], hiddenIds).slice(0, 9);

	return (
		<button
			type='button'
			className='bookmark-folder-card'
			onClick={onOpen}
			aria-label={`打开文件夹：${folder.title}`}
			title={folder.title}>
			<div className='theme-folder-preview bookmark-folder-preview'>
				{previewBookmarks.map(bookmark => (
					<FolderPreviewItem key={bookmark.id} bookmark={bookmark} />
				))}
				{previewBookmarks.length === 0 && (
					<span className='col-span-3 row-span-3 flex items-center justify-center text-xl'>
						<FolderOpenOutlined />
					</span>
				)}
			</div>
			<div className='home-bookmark-title'>{folder.title}</div>
		</button>
	);
};

export const BookmarkFolder: React.FC<BookmarkFolderProps> = ({
	folder,
	hiddenBookmarkIds = []
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [currentFolderId, setCurrentFolderId] = useState(folder.id);
	const hiddenIds = useMemo(
		() => new Set(hiddenBookmarkIds),
		[hiddenBookmarkIds]
	);
	const path = findBookmarkFolderPath(folder, currentFolderId) || [folder];
	const currentFolder = path[path.length - 1];
	const bookmarks = currentFolder.children?.filter(
		item => item.url && !hiddenIds.has(item.id)
	) || [];
	const childFolders = currentFolder.children?.filter(item => !item.url) || [];
	const allBookmarks = collectBookmarks(currentFolder.children || [], hiddenIds);

	const openFolder = () => {
		setCurrentFolderId(folder.id);
		setIsOpen(true);
	};
	const closeFolder = () => {
		setIsOpen(false);
		setCurrentFolderId(folder.id);
	};
	const openAllBookmarks = async () => {
		await Promise.all(allBookmarks.map(bookmark =>
			chrome.tabs.create({ url: bookmark.url, active: false })
		));
		message.success(`已在后台打开 ${allBookmarks.length} 个书签`);
	};
	const confirmOpenAll = () => {
		if (allBookmarks.length <= 10) {
			void openAllBookmarks();
			return;
		}
		Modal.confirm({
			title: `打开 ${allBookmarks.length} 个书签？`,
			content: '将一次创建多个后台标签页，可能占用较多内存。',
			okText: '继续打开',
			cancelText: '取消',
			onOk: openAllBookmarks
		});
	};

	return (
		<>
			<FolderTile folder={folder} hiddenIds={hiddenIds} onOpen={openFolder} />

			<Modal
				className='bookmark-folder-modal'
				title={
					<div className='pr-8'>
						<div className='flex items-center gap-2'>
							{path.length > 1 && (
								<button
									type='button'
									className='theme-icon-button flex h-11 w-11 shrink-0 items-center justify-center rounded-xl'
									onClick={() => setCurrentFolderId(path[path.length - 2].id)}
									aria-label='返回上级文件夹'>
									<ArrowLeftOutlined />
								</button>
							)}
							<div className='min-w-0'>
								<h2 className='m-0 truncate text-base'>{currentFolder.title}</h2>
								<nav className='mt-1 flex flex-wrap items-center gap-1 text-xs text-[var(--text-tertiary)]' aria-label='文件夹路径'>
									{path.map((pathFolder, index) => (
										<span key={pathFolder.id} className='flex items-center gap-1'>
											{index > 0 && <span aria-hidden='true'>/</span>}
											<button type='button' className='rounded px-1 hover:text-blue-500' onClick={() => setCurrentFolderId(pathFolder.id)}>{pathFolder.title}</button>
										</span>
									))}
								</nav>
							</div>
						</div>
					</div>
				}
				open={isOpen}
				onCancel={closeFolder}
				footer={
					<Button
						icon={<FolderOpenOutlined />}
						onClick={confirmOpenAll}
						disabled={allBookmarks.length === 0}>
						在后台打开全部（{allBookmarks.length}）
					</Button>
				}
				width={720}
				centered>
				<div className='bookmark-folder-modal-content bookmark-grid grid py-3 min-h-24'>
					{bookmarks.map(bookmark => (
						<BookmarkCard key={bookmark.id} bookmark={bookmark} />
					))}
					{childFolders.map(childFolder => (
						<FolderTile
							key={childFolder.id}
							folder={childFolder}
							hiddenIds={hiddenIds}
							onOpen={() => setCurrentFolderId(childFolder.id)}
						/>
					))}
					{bookmarks.length === 0 && childFolders.length === 0 && (
						<div className='col-span-full py-8 text-center text-gray-400'>此文件夹为空</div>
					)}
				</div>
			</Modal>
		</>
	);
};
