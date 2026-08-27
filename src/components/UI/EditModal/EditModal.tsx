import { useEffect, useState } from 'react';
import { Input, Modal, message } from 'antd';
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
	const [isSaving, setIsSaving] = useState(false);

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

		setIsSaving(true);
		try {
			await onSave({
				title: title.trim(),
				url: normalizeBookmarkUrl(url)
			});
			message.success('书签已更新');
		} catch (error) {
			console.error('保存失败:', error);
			message.error(error instanceof Error ? error.message : '保存失败，请重试');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Modal
			title='编辑书签'
			open={isOpen && Boolean(bookmark)}
			onCancel={onCancel}
			onOk={() => void handleSave()}
			okText='保存'
			cancelText='取消'
			confirmLoading={isSaving}
			destroyOnHidden>
			<div className='space-y-4 py-2'>
				<label className='block' htmlFor='editTitle'>
					<span className='mb-1.5 block text-sm font-medium text-[var(--text-secondary)]'>
						标题
					</span>
					<Input
						id='editTitle'
						value={title}
						onChange={event => setTitle(event.target.value)}
						onPressEnter={() => void handleSave()}
						placeholder='书签标题'
						autoFocus
					/>
				</label>
				<label className='block' htmlFor='editUrl'>
					<span className='mb-1.5 block text-sm font-medium text-[var(--text-secondary)]'>
						网址
					</span>
					<Input
						id='editUrl'
						value={url}
						onChange={event => setUrl(event.target.value)}
						onPressEnter={() => void handleSave()}
						placeholder='https://example.com'
					/>
				</label>
			</div>
		</Modal>
	);
};
