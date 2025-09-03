import { Bookmark } from '../../types';
import { useDragDrop } from '../../hooks/useDragDrop';
import './BookmarkCard.css';

interface BookmarkCardProps {
	bookmark: Bookmark;
	onEdit: (bookmark: Bookmark) => void;
	onDelete: (id: string) => void;
	onBookmarkMoved?: () => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
	bookmark,
	onEdit,
	onDelete,
	onBookmarkMoved
}) => {
	const {
		handleDragStart,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		handleDragEnd,
		dragOverItem
	} = useDragDrop({ onBookmarkMoved });

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
			// 使用多个图标服务作为备选
			return chrome.runtime.getURL(
				`_favicon/?pageUrl=${encodeURIComponent(url)}&size=48`
			);
		} catch (error) {
			console.warn('无效的URL格式:', url, error);
			return '';
		}
	};

	const faviconUrl = getFaviconUrl(bookmark.url);

	// 获取标题的第一个字符作为备选显示
	const getFirstChar = (title: string) => {
		return title?.trim().charAt(0).toUpperCase() || '🔗';
	};

	return (
		<div
			className={`bookmark-card ${
				dragOverItem === bookmark.id ? 'drag-over' : ''
			}`}
			draggable
			onDragStart={(e) => {
				console.log('拖拽开始:', bookmark.title);
				handleDragStart(e, bookmark);
			}}
			onDragOver={(e) => {
				console.log('拖拽经过:', bookmark.title);
				handleDragOver(e, bookmark.id);
			}}
			onDragLeave={() => {
				console.log('拖拽离开:', bookmark.title);
				handleDragLeave();
			}}
			onDrop={(e) => {
				console.log('拖拽放置:', bookmark.title);
				handleDrop(e, bookmark.id);
				handleDragEnd();
			}}
			onDragEnd={() => {
				console.log('拖拽结束:', bookmark.title);
			}}
			onClick={handleClick}
			title={`${bookmark.title}\n${bookmark.url}`}
		>
			<div className='bookmark-content'>
				<div className='bookmark-icon-container'>
					<img
						className='bookmark-icon'
						src={faviconUrl}
						onLoad={(e) => {
							// 如果图标加载成功，隐藏备选div
							const fallback = (e.target as HTMLImageElement).parentElement?.querySelector('.bookmark-icon-fallback');
							if (fallback) {
								(fallback as HTMLElement).style.display = 'none';
							}
						}}
						onError={(e) => {
							// 如果图标加载失败，隐藏图片并显示标题首字符
							(e.target as HTMLImageElement).style.display = 'none';
						}}
					/>
					<div className='bookmark-icon-fallback'>
						{getFirstChar(bookmark.title)}
					</div>
				</div>
				<div className='bookmark-info'>
					<div className='bookmark-title' title={bookmark.title}>
						{bookmark.title}
					</div>
					<div className='bookmark-url' title={bookmark.url}>
						{(() => {
							try {
								return new URL(bookmark.url).hostname;
							} catch {
								return bookmark.url;
							}
						})()}
					</div>
				</div>
			</div>

			<div className='bookmark-actions'>
				<button
					className='action-button edit-button'
					onClick={handleEdit}
					title='编辑'
				>
					✏️
				</button>
				<button
					className='action-button delete-button'
					onClick={handleDelete}
					title='删除'
				>
					🗑️
				</button>
				<div className='drag-handle' title='拖拽排序'>
					⋮⋮
				</div>
			</div>
		</div>
	);
};
