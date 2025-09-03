import { Bookmark } from '../types';
import { useDragDrop } from '../hooks/useDragDrop';
import './BookmarkCard.css';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  onEdit,
  onDelete
}) => {
  const {
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    dragOverItem
  } = useDragDrop();

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
    window.open(bookmark.url, '_blank');
  };

  // 获取网站图标URL
  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // 使用多个图标服务作为备选
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
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
      onDragStart={(e) => handleDragStart(e, bookmark)}
      onDragOver={(e) => handleDragOver(e, bookmark.id)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, bookmark.id)}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      title={`${bookmark.title}\n${bookmark.url}`}
    >
      <div className="bookmark-content">
        <div className="bookmark-icon-container">
          <img 
            className="bookmark-icon" 
            src={faviconUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iI2U1ZTVlNSIvPgo8cGF0aCBkPSJNMTAgNkM4LjM0MzE1IDYgNyA3LjM0MzE1IDcgOUM3IDEwLjY1NjkgOC4zNDMxNSAxMiAxMCAxMkMxMS42NTY5IDEyIDEzIDEwLjY1NjkgMTMgOUMxMyA3LjM0MzE1IDExLjY1NjkgNiAxMCA2WiIgZmlsbD0iIzk5OTk5OSIvPgo8cGF0aCBkPSJNMTAgMTNDNy43OTA4NiAxMyA2IDE0Ljc5MDkgNiAxN0g3QzcgMTUuMzQzOSA4LjM0MzE1IDE0IDEwIDE0QzExLjY1NjkgMTQgMTMgMTUuMzQzOSAxMyAxN0gxNEMxNCAxNC43OTA5IDEyLjIwOTEgMTMgMTAgMTNaIiBmaWxsPSIjOTk5OTk5Ii8+Cjwvc3ZnPgo='} 
            alt=""
            onError={(e) => {
              // 如果图标加载失败，隐藏图片并显示标题首字符
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="bookmark-icon-fallback">
            {getFirstChar(bookmark.title)}
          </div>
        </div>
        <div className="bookmark-info">
          <div className="bookmark-title" title={bookmark.title}>
            {bookmark.title}
          </div>
          <div className="bookmark-url" title={bookmark.url}>
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

      <div className="bookmark-actions">
        <button
          className="action-button edit-button"
          onClick={handleEdit}
          title="编辑"
        >
          ✏️
        </button>
        <button
          className="action-button delete-button"
          onClick={handleDelete}
          title="删除"
        >
          🗑️
        </button>
        <div className="drag-handle" title="拖拽排序">
          ⋮⋮
        </div>
      </div>
    </div>
  );
};
