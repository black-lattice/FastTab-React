import { memo, useState } from 'react';
import { Bookmark } from '../../types';
import { useDragDrop } from '../../hooks/useDragDrop';

interface BookmarkCardProps {
	bookmark: Bookmark;
	onEdit: (bookmark: Bookmark) => void;
	onDelete: (id: string) => void;
	onBookmarkMoved?: () => void;
	onBookmarkMoveOptimized?: (
		draggedId: string,
		targetId: string
	) => Promise<void>;
}

const BookmarkCardComponent: React.FC<BookmarkCardProps> = ({
	bookmark,
	onEdit,
	onDelete,
	onBookmarkMoved,
	onBookmarkMoveOptimized
}) => {
	const {
		handleDragStart,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		handleDragEnd
	} = useDragDrop({ onBookmarkMoved, onBookmarkMoveOptimized });

	const [showActionButtons, setShowActionButtons] = useState(false);

	const handleEdit = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onEdit(bookmark);
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (confirm(`确定要删除书签 "${bookmark.title}" 吗？`)) {
			onDelete(bookmark.id);
		}
	};

	const handleClick = () => {
		// 在当前页签打开链接，而不是新页签
		window.location.href = bookmark.url;
	};

	// 获取网站图标URL
	const getFaviconUrl = (url: string) => {
		try {
			// 使用64px尺寸的图标，提高显示效果
			return chrome.runtime.getURL(
				`_favicon/?pageUrl=${encodeURIComponent(url)}&size=128`
			);
		} catch (error) {
			console.warn('无效的URL格式:', url, error);
			return '';
		}
	};

	const [imageLoaded, setImageLoaded] = useState(false);
	const [imageError, setImageError] = useState(false);

	const faviconUrl = getFaviconUrl(bookmark.url);

	const handleImageLoad = () => {
		setImageLoaded(true);
		setImageError(false);
	};

	const handleImageError = () => {
		setImageLoaded(false);
		setImageError(true);
	};

	// 处理书签标题，如果包含 '-' 则只显示 '-' 之前的内容
	const getDisplayTitle = (title: string) => {
		if (!title) return '';
		const dashIndex = title.indexOf('-');
		if (dashIndex > 0) {
			return title.substring(0, dashIndex).trim();
		}
		return title;
	};

	// 获取标题的第一个字符作为备选显示
	const getFirstChar = (title: string) => {
		const displayTitle = getDisplayTitle(title);
		return displayTitle?.trim().charAt(0).toUpperCase() || '🔗';
	};

	return (
		<div
			className='bg-transparent hover:bg-transparent rounded-lg cursor-pointer transition-all duration-200 flex flex-col'
			draggable
			onDragStart={e => {
				console.log('拖拽开始:', bookmark.title);
				handleDragStart(e, bookmark);
			}}
			onDragOver={e => {
				console.log('拖拽经过:', bookmark.title);
				handleDragOver(e, bookmark.id);
			}}
			onDragLeave={() => {
				console.log('拖拽离开:', bookmark.title);
				handleDragLeave();
			}}
			onDrop={e => {
				console.log('拖拽放置:', bookmark.title);
				handleDrop(e, bookmark.id);
				// handleDragEnd会在handleDrop内部异步完成后调用
			}}
			onDragEnd={() => {
				console.log('拖拽结束:', bookmark.title);
				handleDragEnd();
			}}
			onClick={handleClick}
			onMouseEnter={() => setShowActionButtons(true)}
			onMouseLeave={() => setShowActionButtons(false)}
			title={`${bookmark.title}\n${bookmark.url}`}>
			<div className='flex flex-col items-center justify-center h-full'>
				<div
					className='flex-shrink-0 relative'
					style={{ width: '60px', height: '60px' }}>
					{/* 毛玻璃背景 - 只在显示备选字母时显示 */}
					{(!imageLoaded || imageError) && (
						<div
							className='absolute inset-0 backdrop-blur-sm bg-white/10 border border-white/20 rounded'
							style={{ width: '60px', height: '60px' }}></div>
					)}
					{!imageError && (
						<img
							className='rounded relative z-10'
							style={{ width: '60px', height: '60px' }}
							src={faviconUrl}
							onLoad={handleImageLoad}
							onError={handleImageError}
						/>
					)}
					{(!imageLoaded || imageError) && (
						<div
							className='flex items-center justify-center text-white text-lg font-medium relative z-10'
							style={{ width: '60px', height: '60px' }}>
							{getFirstChar(bookmark.title)}
						</div>
					)}
					{showActionButtons && (
						<div className='absolute -top-2 -right-2 flex items-center space-x-1 bg-white/10 backdrop-blur-md rounded-lg shadow-lg border border-white/20 z-50 gap-2 px-1'>
							<button
								className='hover:bg-white/30 rounded text-white text-xs transition-all duration-200 hover:scale-110'
								onClick={handleEdit}
								title='编辑'>
								✏️
							</button>
							<button
								className=' hover:bg-white/30 rounded text-white text-xs transition-all duration-200 hover:scale-110'
								onClick={handleDelete}
								title='删除'>
								🗑️
							</button>
						</div>
					)}
				</div>
				<div
					className='text-white text-sm font-medium leading-tight break-words overflow-hidden text-center h-8 flex items-center justify-center mt-2'
					style={{
						display: '-webkit-box',
						WebkitLineClamp: 2,
						WebkitBoxOrient: 'vertical',
						wordBreak: 'break-word',
						overflowWrap: 'break-word'
					}}>
					{getDisplayTitle(bookmark.title)}
				</div>
			</div>
		</div>
	);
};

export default memo(BookmarkCardComponent);
