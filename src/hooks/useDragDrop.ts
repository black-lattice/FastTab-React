import { useState, useCallback } from 'react';
import { Bookmark } from '../types';

interface UseDragDropProps {
	onBookmarkMoved?: () => void;
	onBookmarkMoveOptimized?: (
		draggedId: string,
		targetId: string
	) => Promise<void>;
}

export const useDragDrop = ({
	onBookmarkMoved,
	onBookmarkMoveOptimized
}: UseDragDropProps = {}) => {
	const [draggedItem, setDraggedItem] = useState<Bookmark | null>(null);
	const [dragOverItem, setDragOverItem] = useState<string | null>(null);

	const handleDragStart = useCallback(
		(e: React.DragEvent, bookmark: Bookmark) => {
			console.log('设置拖拽书签:', bookmark.title, 'ID:', bookmark.id);
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

	// 获取书签索引的辅助函数
	const getBookmarkIndex = useCallback(
		async (bookmarkId: string): Promise<number | undefined> => {
			try {
				const [bookmark] = await chrome.bookmarks.get(bookmarkId);
				return bookmark.index;
			} catch (error) {
				console.error('获取书签索引失败:', error);
				return undefined;
			}
		},
		[]
	);

	const handleDrop = useCallback(
		async (e: React.DragEvent, targetBookmarkId: string) => {
			e.preventDefault();
			e.stopPropagation();
			console.log('进入handleDrop函数');

			// 直接从事件数据中获取拖拽书签ID
			const draggedBookmarkId = e.dataTransfer.getData('text/plain');
			console.log('从事件数据获取拖拽书签ID:', draggedBookmarkId);

			if (!draggedBookmarkId) {
				console.log('无效的拖拽操作: 无法获取拖拽书签ID');
				setDragOverItem(null);
				return;
			}

			if (draggedBookmarkId === targetBookmarkId) {
				console.log(
					'无效的拖拽操作: 拖拽书签和目标书签相同',
					draggedBookmarkId,
					targetBookmarkId
				);
				setDragOverItem(null);
				setDraggedItem(null);
				return;
			}

			try {
				console.log('开始处理拖拽事件');
				console.log('拖拽书签ID:', draggedBookmarkId);
				console.log('目标书签ID:', targetBookmarkId);

				// 优先使用优化后的移动回调
				if (onBookmarkMoveOptimized) {
					console.log('使用优化移动回调');
					await onBookmarkMoveOptimized(draggedBookmarkId, targetBookmarkId);
					console.log('优化移动回调执行成功');
				} else {
					// 获取拖拽书签的详细信息
					const [draggedBookmark] = await chrome.bookmarks.get(
						draggedBookmarkId
					);
					console.log(
						'拖拽书签详情:',
						draggedBookmark.title,
						'ID:',
						draggedBookmark.id
					);

					// 获取拖拽书签和目标书签的索引
					const draggedIndex = await getBookmarkIndex(draggedBookmarkId);
					const targetIndex = await getBookmarkIndex(targetBookmarkId);

					console.log('拖拽索引:', draggedIndex, '目标索引:', targetIndex);

					if (draggedIndex !== undefined && targetIndex !== undefined) {
						// 计算新的索引位置
						// 如果拖拽书签在目标书签之前，移动到目标位置；如果在之后，移动到目标位置之后
						let newIndex = targetIndex;
						// draggedIndex < targetIndex ? targetIndex : targetIndex + 1;

						// 如果拖拽书签和目标书签在同一个位置，不需要移动
						if (draggedIndex === newIndex) {
							console.log('书签已在目标位置，无需移动');
							return;
						}

						console.log('新索引位置:', newIndex);
						console.log(
							'移动书签:',
							draggedBookmark.title,
							'从位置',
							draggedIndex,
							'到位置',
							newIndex
						);

						// 调用Chrome API移动书签
						await chrome.bookmarks.move(draggedBookmarkId, {
							parentId: draggedBookmark.parentId,
							index: newIndex
						});

						console.log(`移动书签 ${draggedBookmark.title} 到位置 ${newIndex}`);

						// 触发书签移动后的重新加载
						if (onBookmarkMoved) {
							console.log('触发重新加载回调');
							try {
								await onBookmarkMoved();
								console.log('重新加载回调执行成功');
							} catch (error) {
								console.error('重新加载回调执行失败:', error);
							}
						}
					}
				}
			} catch (error) {
				console.error('移动书签失败:', error);
			} finally {
				setDragOverItem(null);
				setDraggedItem(null);
			}
		},
		[draggedItem, getBookmarkIndex, onBookmarkMoved, onBookmarkMoveOptimized]
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
