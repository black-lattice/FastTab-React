import { useState, useCallback } from 'react';
import { Bookmark } from '../types';
import { useBookmarkStore } from '../store/bookmarkStore';

export const useDragDrop = () => {
	const { loadBookmarks, moveBookmarkOptimized } = useBookmarkStore();
	const [draggedItem, setDraggedItem] = useState<Bookmark | null>(null);
	const [dragOverItem, setDragOverItem] = useState<string | null>(null);

	const handleDragStart = useCallback(
		(e: React.DragEvent, bookmark: Bookmark) => {
			setDraggedItem(bookmark);
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', bookmark.id);
		},
		[]
	);

	const handleDragOver = useCallback(
		(e: React.DragEvent, bookmarkId: string) => {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
			setDragOverItem(bookmarkId);
		},
		[]
	);

	const handleDragLeave = useCallback(() => {
		setDragOverItem(null);
	}, []);

	const handleDrop = useCallback(
		async (e: React.DragEvent, targetBookmarkId: string) => {
			e.preventDefault();
			e.stopPropagation();

			const draggedBookmarkId = e.dataTransfer.getData('text/plain');

			if (!draggedBookmarkId || draggedBookmarkId === targetBookmarkId) {
				setDragOverItem(null);
				setDraggedItem(null);
				return;
			}

			try {
				await moveBookmarkOptimized(draggedBookmarkId, targetBookmarkId);
			} catch (error) {
				console.error('移动书签失败:', error);
				await loadBookmarks();
			} finally {
				setDragOverItem(null);
				setDraggedItem(null);
			}
		},
		[moveBookmarkOptimized, loadBookmarks]
	);

	const handleDragEnd = useCallback(() => {
		setDraggedItem(null);
		setDragOverItem(null);
	}, []);

	return {
		draggedItem,
		dragOverItem,
		handleDragStart,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		handleDragEnd
	};
};