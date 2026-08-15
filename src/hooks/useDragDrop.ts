import { useCallback } from 'react';
import { message } from 'antd';
import { Bookmark } from '../types';
import { useBookmarkStore } from '../store/bookmarkStore';

const findBookmarkCard = (element: EventTarget & Element) =>
	(element as HTMLElement).closest<HTMLElement>('.bookmark-card');

export const useDragDrop = () => {
	const moveBookmarkOptimized = useBookmarkStore(
		state => state.moveBookmarkOptimized
	);

	const handleDragStart = useCallback(
		(event: React.DragEvent, bookmark: Bookmark) => {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/plain', bookmark.id);
			findBookmarkCard(event.currentTarget)?.classList.add('is-dragging');
		},
		[]
	);
	const handleDragOver = useCallback((event: React.DragEvent) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
		findBookmarkCard(event.currentTarget)?.classList.add('is-drop-target');
	}, []);
	const handleDragLeave = useCallback((event: React.DragEvent) => {
		const nextTarget = event.relatedTarget;
		if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
			return;
		}
		findBookmarkCard(event.currentTarget)?.classList.remove('is-drop-target');
	}, []);
	const handleDrop = useCallback(
		async (event: React.DragEvent, targetBookmarkId: string) => {
			event.preventDefault();
			event.stopPropagation();
			findBookmarkCard(event.currentTarget)?.classList.remove('is-drop-target');
			const draggedBookmarkId = event.dataTransfer.getData('text/plain');

			if (!draggedBookmarkId || draggedBookmarkId === targetBookmarkId) return;
			try {
				await moveBookmarkOptimized(draggedBookmarkId, targetBookmarkId);
			} catch (error) {
				message.warning(
					error instanceof Error ? error.message : '书签排序失败'
				);
			}
		},
		[moveBookmarkOptimized]
	);
	const handleDragEnd = useCallback((event: React.DragEvent) => {
		findBookmarkCard(event.currentTarget)?.classList.remove('is-dragging');
		document
			.querySelectorAll('.bookmark-card.is-drop-target')
			.forEach(card => card.classList.remove('is-drop-target'));
	}, []);

	return {
		handleDragStart,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		handleDragEnd
	};
};
