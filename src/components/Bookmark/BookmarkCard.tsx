import { memo, useState } from 'react';
import { Bookmark } from '../../types';
import { useDragDrop } from '../../hooks/useDragDrop';
import { useFavicon } from '../../hooks/useFavicon';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { useUIStore } from '../../store/uiStore';

interface BookmarkCardProps {
	bookmark: Bookmark;
}

const BookmarkCardComponent: React.FC<BookmarkCardProps> = ({
	bookmark
}) => {
	const { removeBookmark } = useBookmarkStore();
	const { openEditModal } = useUIStore();
	const {
		handleDragStart,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		handleDragEnd
	} = useDragDrop();

	const [showActionButtons, setShowActionButtons] = useState(false);

	const handleEdit = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		openEditModal(bookmark);
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (confirm(`确定要删除书签 "${bookmark.title}" 吗？`)) {
			removeBookmark(bookmark.id);
		}
	};

	const handleClick = () => {
		// 在当前页签打开链接，而不是新页签
		window.location.href = bookmark.url;
	};

	// 使用 useFavicon hook 获取图标
	const { faviconUrl } = useFavicon(bookmark.url);
	const [imageLoaded, setImageLoaded] = useState(false);

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

	const showFallback = !faviconUrl || !imageLoaded;

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
					{showFallback && (
						<div
							className='absolute inset-0 backdrop-blur-sm bg-[var(--icon-surface)] border border-[var(--border-color)] rounded'
							style={{ width: '60px', height: '60px' }}></div>
					)}
					{faviconUrl && (
						<img
							className={`rounded relative z-10 transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
							style={{ width: '60px', height: '60px' }}
							src={faviconUrl}
							alt={bookmark.title}
							onLoad={() => setImageLoaded(true)}
						/>
					)}
					{showFallback && (
						<div
							className='flex items-center justify-center text-[var(--text-primary)] text-lg font-medium absolute inset-0 z-10'
							style={{ width: '60px', height: '60px' }}>
							{getFirstChar(bookmark.title)}
						</div>
					)}
					{showActionButtons && (
						<div className='absolute -top-2 -right-2 flex items-center space-x-1 bg-[var(--surface-color)] backdrop-blur-md rounded-lg shadow-lg border border-[var(--border-color)] z-50 gap-2 px-1'>
							<button
								className='hover:bg-[var(--surface-muted)] rounded text-[var(--text-primary)] text-xs transition-all duration-200 hover:scale-110'
								onClick={handleEdit}
								title='编辑'>
								✏️
							</button>
							<button
								className='hover:bg-[var(--surface-muted)] rounded text-[var(--text-primary)] text-xs transition-all duration-200 hover:scale-110'
								onClick={handleDelete}
								title='删除'>
								🗑️
							</button>
						</div>
					)}
				</div>
				<div
				className='text-[var(--text-primary)] text-xs font-medium leading-tight break-words overflow-hidden text-center h-8 flex items-center justify-center mt-2'
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
