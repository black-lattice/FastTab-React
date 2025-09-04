import { useState } from 'react';
import { Bookmark } from '../../types';
import BookmarkCard from './BookmarkCard';
import './BookmarkFolder.css';

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
	const bookmarks = folder.children?.filter((item) => item.url) || [];

	return (
		<div className='bookmark-folder' id={`folder-${folder.id}`}>
			<div className='folder-header' onClick={toggleExpanded}>
				<h3 className='folder-title'>{folder.title}</h3>
				<div className='folder-count'>{bookmarks.length} 个书签</div>
			</div>

			{isExpanded && (
				<div className='folder-content'>
					{/* 只显示当前文件夹内的书签，不显示子文件夹 */}
					{bookmarks.length > 0 && (
						<div className='bookmarks-grid'>
							{bookmarks.map((bookmark) => (
								<BookmarkCard
									key={bookmark.id}
									bookmark={bookmark}
									onEdit={onEdit}
									onDelete={onDelete}
									onBookmarkMoved={onBookmarkMoved}
									onBookmarkMoveOptimized={onBookmarkMoveOptimized}
								/>
							))}
						</div>
					)}
					{bookmarks.length === 0 && (
						<div className='empty-folder'>
							<p>此文件夹为空</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
};
