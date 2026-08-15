import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { message } from 'antd';
import { Bookmark } from '../../../types';
import { normalizeBookmarkUrl } from '../../../utils/bookmarkUrl';

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
	}, [isOpen, bookmark]);

	const handleSave = async () => {
		if (!title.trim()) {
			message.error('请输入书签名称');
			return;
		}

		try {
			await onSave({
				title: title.trim(),
				url: normalizeBookmarkUrl(url)
			});
			message.success('书签已更新');
		} catch (error) {
			console.error('保存失败:', error);
			message.error(error instanceof Error ? error.message : '保存失败，请重试');
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

	return createPortal(
		<div
			className='bookmark-edit-modal-mask fixed inset-0 flex items-center justify-center p-4'
			onClick={onCancel}>
			<div
				className='theme-panel bookmark-edit-modal-panel w-full max-w-md rounded-xl p-6 shadow-2xl'
				role='dialog'
				aria-modal='true'
				aria-labelledby='bookmark-edit-modal-title'
				onClick={e => e.stopPropagation()}>
				<h3
					id='bookmark-edit-modal-title'
					className='text-xl font-semibold text-[var(--text-primary)] mb-4'>
					编辑书签
				</h3>
				<div className='space-y-4'>
					<div className='flex flex-col'>
						<label
							htmlFor='editTitle'
							className='text-sm font-medium text-[var(--text-secondary)] mb-1'>
							标题
						</label>
						<input
							type='text'
							id='editTitle'
							value={title}
							onChange={e => setTitle(e.target.value)}
							onKeyDown={handleKeyPress}
							placeholder='书签标题'
							autoFocus
							className='theme-input w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors'
						/>
					</div>
					<div className='flex flex-col'>
						<label
							htmlFor='editUrl'
							className='text-sm font-medium text-[var(--text-secondary)] mb-1'>
							网址
						</label>
						<input
							type='url'
							id='editUrl'
							value={url}
							onChange={e => setUrl(e.target.value)}
							onKeyDown={handleKeyPress}
							placeholder='https://example.com'
							className='theme-input w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors'
						/>
					</div>
				</div>
				<div className='flex gap-3 mt-6'>
					<button
						className='flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium'
						onClick={handleSave}>
						保存
					</button>
					<button
						className='theme-secondary-button flex-1 py-2 px-4 rounded-lg transition-colors font-medium'
						onClick={onCancel}>
						取消
					</button>
				</div>
			</div>
		</div>,
		document.body
	);
};
