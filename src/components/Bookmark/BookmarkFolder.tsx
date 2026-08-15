import { useState } from 'react';
import { Modal } from 'antd';
import { FolderOpenOutlined, LinkOutlined } from '@ant-design/icons';
import { Bookmark } from '../../types';
import { useFavicon } from '../../hooks/useFavicon';
import BookmarkCard from './BookmarkCard';

interface BookmarkFolderProps {
	folder: Bookmark;
	hiddenBookmarkIds?: string[];
}

const collectBookmarks = (
	nodes: Bookmark[],
	hiddenBookmarkIds: string[]
): Bookmark[] =>
	nodes.flatMap(node => {
		if (node.url) {
			return hiddenBookmarkIds.includes(node.id) ? [] : [node];
		}
		return collectBookmarks(node.children || [], hiddenBookmarkIds);
	});

const FolderPreviewItem: React.FC<{ bookmark: Bookmark }> = ({ bookmark }) => {
	const { faviconUrl, handleFaviconError } = useFavicon(bookmark.url);

	return (
		<div className='theme-preview-item flex items-center justify-center overflow-hidden rounded-sm text-[10px] font-semibold'>
			{faviconUrl ? (
				<img
					className='bookmark-favicon-image w-full h-full object-contain'
					src={faviconUrl}
					alt=''
					onError={handleFaviconError}
				/>
			) : (
				bookmark.title.trim().charAt(0).toUpperCase() || <LinkOutlined />
			)}
		</div>
	);
};

export const BookmarkFolder: React.FC<BookmarkFolderProps> = ({
	folder,
	hiddenBookmarkIds = []
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const bookmarks =
		folder.children?.filter(
			item => item.url && !hiddenBookmarkIds.includes(item.id)
		) || [];
	const childFolders = folder.children?.filter(item => !item.url) || [];
	const previewBookmarks = collectBookmarks(
		folder.children || [],
		hiddenBookmarkIds
	).slice(0, 9);

	return (
		<>
			<button
				type='button'
				className='bookmark-folder-card'
				onClick={() => setIsOpen(true)}
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
				<div
					className='home-bookmark-title'
					style={{
						display: '-webkit-box',
						WebkitLineClamp: 2,
						WebkitBoxOrient: 'vertical'
					}}>
					{folder.title}
				</div>
			</button>

			<Modal
				className='bookmark-folder-modal'
				title={folder.title}
				open={isOpen}
				onCancel={() => setIsOpen(false)}
				footer={null}
				width={720}
				centered>
				<div className='bookmark-folder-modal-content grid grid-cols-[repeat(auto-fill,80px)] gap-4 py-3 min-h-24'>
					{bookmarks.map(bookmark => (
						<BookmarkCard key={bookmark.id} bookmark={bookmark} />
					))}
					{childFolders.map(childFolder => (
						<BookmarkFolder
							key={childFolder.id}
							folder={childFolder}
							hiddenBookmarkIds={hiddenBookmarkIds}
						/>
					))}
					{bookmarks.length === 0 && childFolders.length === 0 && (
						<div className='col-span-full py-8 text-center text-gray-400'>
							此文件夹为空
						</div>
					)}
				</div>
			</Modal>
		</>
	);
};
