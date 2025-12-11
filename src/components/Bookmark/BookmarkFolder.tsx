import { useState } from 'react';
import { Bookmark } from '../../types';
import BookmarkCard from './BookmarkCard';

interface BookmarkFolderProps {
	folder: Bookmark;
	onEdit: (bookmark: Bookmark) => void;
	onDelete: (id: string) => void;
	onBookmarkMoved?: () => void;
	onBookmarkMoveOptimized?: (
		draggedId: string,
		targetId: string
	) => Promise<void>;
}

export const BookmarkFolder: React.FC<BookmarkFolderProps> = ({
	folder,
	onEdit,
	onDelete,
	onBookmarkMoved,
	onBookmarkMoveOptimized
}) => {
	const [isExpanded, setIsExpanded] = useState(true);

	const toggleExpanded = () => {
		setIsExpanded(!isExpanded);
	};

	// 只过滤出当前文件夹内的书签（有 URL 的），不显示子文件夹
	const bookmarks = folder.children?.filter(item => item.url) || [];

	return (
		<div
			className='mb-4 bg-transparent rounded-xl overflow-hidden'
			id={`folder-${folder.id}`}>
			<div
				className='flex items-center p-1 cursor-pointer transition-all duration-300 hover:bg-transparent border-b border-transparent'
				onClick={toggleExpanded}>
				<h3 className='flex-1 text-lg font-semibold text-white'>
					{folder.title}
				</h3>
				<div className='ml-3 px-2 py-1 bg-transparent rounded-full text-xs text-white font-medium'>
					{bookmarks.length} 个书签
				</div>
			</div>

			{isExpanded && (
				<div className='p-2 w-full'>
					{/* 只显示当前文件夹内的书签,不显示子文件夹 */}
					{bookmarks.length > 0 && (
						<div className='grid grid-cols-[repeat(auto-fit,70px)] w-full'>
							{bookmarks.map(bookmark => (
								<BookmarkCard
									key={bookmark.id}
									bookmark={bookmark}
									onEdit={onEdit}
									onDelete={onDelete}
									onBookmarkMoved={onBookmarkMoved}
									onBookmarkMoveOptimized={
										onBookmarkMoveOptimized
									}
								/>
							))}
						</div>
					)}
					{bookmarks.length === 0 && (
						<div className='text-center p-4 text-gray-400 italic'>
							<p className='m-0 text-sm'>此文件夹为空</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
};
