import { useState, useEffect } from 'react';
import { Bookmark } from '../../types';
import './EditModal.css';

interface EditModalProps {
  isOpen: boolean;
  bookmark: Bookmark | null;
  onSave: (changes: Partial<Bookmark>) => Promise<void>;
  onCancel: () => void;
}

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  bookmark,
  onSave,
  onCancel
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title);
      setUrl(bookmark.url);
    }
  }, [bookmark]);

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) {
      alert('请填写完整的书签信息');
      return;
    }

    try {
      await onSave({
        title: title.trim(),
        url: url.trim()
      });
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen || !bookmark) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>编辑书签</h3>
        <div className="modal-form">
          <div className="form-group">
            <label htmlFor="editTitle">标题</label>
            <input
              type="text"
              id="editTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="书签标题"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="editUrl">网址</label>
            <input
              type="url"
              id="editUrl"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="https://example.com"
            />
          </div>
        </div>
        <div className="modal-buttons">
          <button className="btn btn-primary" onClick={handleSave}>
            保存
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
