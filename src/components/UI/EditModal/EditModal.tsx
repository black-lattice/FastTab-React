import { useState, useEffect } from 'react';
import { Bookmark } from '../../../types';

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
			console.log('isOpen:', isOpen);
			console.log('bookmark:', bookmark);
			setTitle(bookmark.title);
			setUrl(bookmark.url);
		}
	}, [isOpen, bookmark]);

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
		<div
			className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
			onClick={onCancel}>
			<div
				className='bg-white rounded-xl shadow-2xl w-full max-w-md p-6'
				onClick={e => e.stopPropagation()}>
				<h3 className='text-xl font-semibold text-gray-900 mb-4'>
					编辑书签
				</h3>
				<div className='space-y-4'>
					<div className='flex flex-col'>
						<label
							htmlFor='editTitle'
							className='text-sm font-medium text-gray-700 mb-1'>
							标题
						</label>
						<input
							type='text'
							id='editTitle'
							value={title}
							onChange={e => setTitle(e.target.value)}
							onKeyPress={handleKeyPress}
							placeholder='书签标题'
							autoFocus
							className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-gray-900'
						/>
					</div>
					<div className='flex flex-col'>
						<label
							htmlFor='editUrl'
							className='text-sm font-medium text-gray-700 mb-1'>
							网址
						</label>
						<input
							type='url'
							id='editUrl'
							value={url}
							onChange={e => setUrl(e.target.value)}
							onKeyPress={handleKeyPress}
							placeholder='https://example.com'
							className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-gray-900'
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
						className='flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium'
						onClick={onCancel}>
						取消
					</button>
				</div>
			</div>
		</div>
	);
};
