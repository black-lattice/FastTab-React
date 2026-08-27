import { memo } from 'react';
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
import { useSearchStore } from '../../store/searchStore';

interface BookmarkCardProps {
	bookmark: Bookmark;
}

const BookmarkCardComponent: React.FC<BookmarkCardProps> = ({ bookmark }) => {
	const removeBookmark = useBookmarkStore(state => state.removeBookmark);
	const openEditModal = useUIStore(state => state.openEditModal);
	const recordBookmarkVisit = useSearchStore(state => state.recordBookmarkVisit);
	const {
		handleDragStart,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		handleDragEnd
	} = useDragDrop();
	const {
		faviconUrl,
		isLoaded: imageLoaded,
		handleFaviconLoad,
		handleFaviconError
	} = useFavicon(bookmark.url);

	const displayTitle = bookmark.title.trim() || bookmark.url;
	const firstChar = displayTitle.charAt(0).toUpperCase() || '•';
	const showFallback = !faviconUrl || !imageLoaded;

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
			okButtonProps: { danger: true },
			cancelText: '取消',
			onOk: async () => {
				try {
					await removeBookmark(bookmark.id);
					message.success('书签已删除');
				} catch (error) {
					message.error(error instanceof Error ? error.message : '删除失败，请重试');
				}
			}
		});
	};

	return (
		<div
			className='bookmark-card group'
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={event => void handleDrop(event, bookmark.id)}
			title={`${displayTitle}\n${bookmark.url}`}>
			<a
				className='bookmark-card-link'
				href={bookmark.url}
				onClick={() => recordBookmarkVisit(bookmark.id)}
				aria-label={`打开书签：${displayTitle}`}>
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
							onLoad={handleFaviconLoad}
							onError={handleFaviconError}
						/>
					)}
				</div>
				<div className='home-bookmark-title'>{displayTitle}</div>
			</a>

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
	);
};

export default memo(BookmarkCardComponent);
