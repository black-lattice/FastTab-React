import { useEffect, useMemo, useState } from 'react';
import { Checkbox, Input, Modal, Select, message } from 'antd';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useUIStore } from '../../store/uiStore';
import { flattenBookmarkFolders } from '../../utils/bookmarkTree';
import { normalizeBookmarkUrl } from '../../utils/bookmarkUrl';
import { useShallow } from 'zustand/react/shallow';

const AddBookmarkModal: React.FC = () => {
	const {
		bookmarksBarId,
		folders,
		createBookmark
	} = useBookmarkStore(useShallow(state => ({
		bookmarksBarId: state.bookmarksBarId,
		folders: state.folders,
		createBookmark: state.createBookmark
	})));
	const { isAddBookmarkOpen, closeAddBookmark } = useUIStore(
		useShallow(state => ({
			isAddBookmarkOpen: state.isAddBookmarkOpen,
			closeAddBookmark: state.closeAddBookmark
		}))
	);
	const [title, setTitle] = useState('');
	const [url, setUrl] = useState('');
	const [folderId, setFolderId] = useState('');
	const [showInWorkspace, setShowInWorkspace] = useState(true);
	const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId);
	const workspaces = useWorkspaceStore(state => state.workspaces);
	const workspace = workspaces.find(item => item.id === activeWorkspaceId);
	const setWorkspaceItems = useWorkspaceStore(state => state.setWorkspaceItems);
	const [isSaving, setIsSaving] = useState(false);

	const folderOptions = useMemo(
		() => [
			{ label: '书签栏（根目录）', value: bookmarksBarId },
			...flattenBookmarkFolders(folders).map(({ folder, depth }) => ({
				label: `${'　'.repeat(depth)}${folder.title}`,
				value: folder.id
			}))
		].filter(option => option.value),
		[bookmarksBarId, folders]
	);

	useEffect(() => {
		if (isAddBookmarkOpen) {
			setTitle('');
			setUrl('');
			setFolderId(bookmarksBarId);
			setShowInWorkspace(true);
		}
	}, [bookmarksBarId, isAddBookmarkOpen]);

	const handleSave = async () => {
		if (isSaving) return;
		if (!title.trim()) {
			message.error('请输入书签名称');
			return;
		}

		setIsSaving(true);
		try {
			const normalizedUrl = normalizeBookmarkUrl(url);
			const bookmark = await createBookmark({
				title: title.trim(),
				url: normalizedUrl,
				parentId: folderId || bookmarksBarId
			});
			if (showInWorkspace && workspace) {
				try {
					await setWorkspaceItems(workspace.id, 'bookmarkIds', [bookmark.id], true);
				} catch {
					message.warning('书签已保存，但加入工作区失败，请在书签管理中重新加入');
					closeAddBookmark();
					return;
				}
			}
			message.success('书签已添加');
			closeAddBookmark();
		} catch (error) {
			message.error(error instanceof Error ? error.message : '添加书签失败');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Modal
			title='添加书签'
			open={isAddBookmarkOpen}
			onCancel={closeAddBookmark}
			onOk={handleSave}
			okText='添加'
			cancelText='取消'
			confirmLoading={isSaving}
			destroyOnHidden>
			<div className='space-y-4 py-2'>
				<label className='block'>
					<span className='mb-1.5 block text-sm font-medium text-[var(--text-secondary)]'>
						名称
					</span>
					<Input
						value={title}
						onChange={event => setTitle(event.target.value)}
						placeholder='例如：项目文档'
						autoFocus
					/>
				</label>
				<label className='block'>
					<span className='mb-1.5 block text-sm font-medium text-[var(--text-secondary)]'>
						网址
					</span>
					<Input
						value={url}
						onChange={event => setUrl(event.target.value)}
						onPressEnter={() => void handleSave()}
						placeholder='example.com'
					/>
				</label>
				<label className='block'>
					<span className='mb-1.5 block text-sm font-medium text-[var(--text-secondary)]'>
						保存到
					</span>
					<Select
						className='w-full'
						value={folderId}
						onChange={setFolderId}
						options={folderOptions}
					/>
				</label>
				{workspace && (
					<Checkbox
						checked={showInWorkspace}
						onChange={event => setShowInWorkspace(event.target.checked)}>
						同时加入“{workspace.name}”工作区
					</Checkbox>
				)}
			</div>
		</Modal>
	);
};

export default AddBookmarkModal;
