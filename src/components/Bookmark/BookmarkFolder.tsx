import { useState } from 'react';
import { Modal } from 'antd';
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
	const { faviconUrl } = useFavicon(bookmark.url);

	return (
		<div className='theme-preview-item flex items-center justify-center overflow-hidden rounded-sm text-[10px] font-semibold'>
			{faviconUrl ? (
				<img
					className='w-full h-full object-contain'
					src={faviconUrl}
					alt=''
				/>
			) : (
				bookmark.title.trim().charAt(0).toUpperCase() || '🔗'
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
				className='w-20 bg-transparent border-0 p-0 cursor-pointer transition-transform duration-200 hover:scale-105'
				onClick={() => setIsOpen(true)}
				title={folder.title}>
				<div className='theme-folder-preview w-[60px] h-[60px] mx-auto p-1.5 grid grid-cols-3 grid-rows-3 gap-0.5 rounded-2xl shadow-lg backdrop-blur-md'>
					{previewBookmarks.map(bookmark => (
						<FolderPreviewItem key={bookmark.id} bookmark={bookmark} />
					))}
					{previewBookmarks.length === 0 && (
						<span className='col-span-3 row-span-3 flex items-center justify-center text-2xl'>
							📁
						</span>
					)}
				</div>
				<div
					className='mt-2 h-8 text-xs font-medium leading-tight text-[var(--text-primary)] text-center overflow-hidden'
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
