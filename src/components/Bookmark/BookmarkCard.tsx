import { memo, useState } from 'react';
import { Modal, message } from 'antd';
import {
	DeleteOutlined,
	DragOutlined,
	EditOutlined
} from '@ant-design/icons';
import { Bookmark } from '../../types';
import { useDragDrop } from '../../hooks/useDragDrop';
import { useFavicon } from '../../hooks/useFavicon';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { useUIStore } from '../../store/uiStore';

interface BookmarkCardProps {
	bookmark: Bookmark;
}

const BookmarkCardComponent: React.FC<BookmarkCardProps> = ({ bookmark }) => {
	const { removeBookmark } = useBookmarkStore();
	const { openEditModal } = useUIStore();
	const {
		handleDragStart,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		handleDragEnd
	} = useDragDrop();
	const { faviconUrl, handleFaviconError } = useFavicon(bookmark.url);
	const [imageLoaded, setImageLoaded] = useState(false);

	const displayTitle = bookmark.title.trim() || bookmark.url;
	const firstChar = displayTitle.charAt(0).toUpperCase() || '•';
	const showFallback = !faviconUrl || !imageLoaded;

	const openBookmark = () => {
		window.location.href = bookmark.url;
	};
	const handleEdit = (event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		openEditModal(bookmark);
	};
	const handleDelete = (event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		Modal.confirm({
			title: '删除这个书签？',
			content: `“${displayTitle}”将从浏览器书签中删除。`,
			okText: '删除',
			okType: 'danger',
			cancelText: '取消',
			onOk: async () => {
				try {
					await removeBookmark(bookmark.id);
					message.success('书签已删除');
				} catch {
					message.error('删除失败，请重试');
				}
			}
		});
	};

	return (
		<div
			className='bookmark-card group'
			role='link'
			tabIndex={0}
			aria-label={`打开书签：${displayTitle}`}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={event => void handleDrop(event, bookmark.id)}
			onClick={openBookmark}
			onKeyDown={event => {
				if (event.target !== event.currentTarget) return;
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					openBookmark();
				}
			}}
			title={`${displayTitle}\n${bookmark.url}`}>
			<div className='bookmark-card-icon-wrap'>
				{showFallback && (
					<div className='bookmark-card-fallback' aria-hidden='true'>
						{firstChar}
					</div>
				)}
				{faviconUrl && (
					<img
						className={`bookmark-favicon-image bookmark-home-favicon relative z-10 object-contain transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
						src={faviconUrl}
						alt=''
						onLoad={() => setImageLoaded(true)}
						onError={() => {
							setImageLoaded(false);
							handleFaviconError();
						}}
					/>
				)}

				<div className='bookmark-card-actions'>
					<button
						type='button'
						className='bookmark-card-action bookmark-card-drag-handle'
						draggable
						onClick={event => event.stopPropagation()}
						onDragStart={event => handleDragStart(event, bookmark)}
						onDragEnd={handleDragEnd}
						aria-label={`拖动 ${displayTitle} 调整顺序`}
						title='拖动排序'>
						<DragOutlined />
					</button>
					<button
						type='button'
						className='bookmark-card-action'
						onClick={handleEdit}
						aria-label={`编辑 ${displayTitle}`}
						title='编辑书签'>
						<EditOutlined />
					</button>
					<button
						type='button'
						className='bookmark-card-action is-danger'
						onClick={handleDelete}
						aria-label={`删除 ${displayTitle}`}
						title='删除书签'>
						<DeleteOutlined />
					</button>
				</div>
			</div>

			<div className='home-bookmark-title'>{displayTitle}</div>
		</div>
	);
};

export default memo(BookmarkCardComponent);
