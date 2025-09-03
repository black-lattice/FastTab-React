import { useState, useCallback } from 'react';
import { Bookmark } from '../types';

export const useDragDrop = () => {
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

      if (!draggedItem || draggedItem.id === targetBookmarkId) {
        setDragOverItem(null);
        setDraggedItem(null);
        return;
      }

      try {
        // 这里可以添加移动书签的逻辑
        console.log(`移动书签 ${draggedItem.title} 到 ${targetBookmarkId}`);
      } catch (error) {
        console.error('移动书签失败:', error);
      } finally {
        setDragOverItem(null);
        setDraggedItem(null);
      }
    },
    [draggedItem]
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
