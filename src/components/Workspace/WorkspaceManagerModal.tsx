import { useEffect, useMemo, useState } from 'react';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Checkbox, Input, Modal, Select, message } from 'antd';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { useUIStore } from '../../store/uiStore';
import { HOME_WORKSPACE_ID, useWorkspaceStore } from '../../store/workspaceStore';
import { flattenBookmarkFolders } from '../../utils/bookmarkTree';

export const WorkspaceManagerModal = () => {
	const isOpen = useUIStore(state => state.isWorkspaceManagerOpen);
	const onClose = useUIStore(state => state.closeWorkspaceManager);
	const bookmarks = useBookmarkStore(state => state.bookmarks);
	const folders = useBookmarkStore(state => state.folders);
	const workspaces = useWorkspaceStore(state => state.workspaces);
	const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId);
	const createWorkspace = useWorkspaceStore(state => state.createWorkspace);
	const updateWorkspace = useWorkspaceStore(state => state.updateWorkspace);
	const deleteWorkspace = useWorkspaceStore(state => state.deleteWorkspace);
	const setActiveWorkspace = useWorkspaceStore(state => state.setActiveWorkspace);
	const [selectedId, setSelectedId] = useState('');
	const [newName, setNewName] = useState('');
	const [name, setName] = useState('');
	const [searchText, setSearchText] = useState('');
	const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
	const [folderIds, setFolderIds] = useState<string[]>([]);
	const [isSaving, setIsSaving] = useState(false);
	const selectedWorkspace = workspaces.find(workspace => workspace.id === selectedId);
	const flatFolders = useMemo(
		() => flattenBookmarkFolders(folders),
		[folders]
	);
	const normalizedSearch = searchText.trim().toLowerCase();
	const visibleBookmarks = bookmarks.filter(bookmark =>
		!normalizedSearch ||
		bookmark.title.toLowerCase().includes(normalizedSearch) ||
		bookmark.url.toLowerCase().includes(normalizedSearch)
	);
	const visibleFolders = flatFolders.filter(({ folder }) =>
		!normalizedSearch || folder.title.toLowerCase().includes(normalizedSearch)
	);

	useEffect(() => {
		if (!isOpen) return;
		const preferredId = activeWorkspaceId !== HOME_WORKSPACE_ID
			? activeWorkspaceId
			: workspaces[0]?.id || '';
		setSelectedId(preferredId);
	}, [activeWorkspaceId, isOpen, workspaces]);

	useEffect(() => {
		if (!selectedWorkspace) {
			setName('');
			setBookmarkIds([]);
			setFolderIds([]);
			return;
		}
		setName(selectedWorkspace.name);
		setBookmarkIds(selectedWorkspace.bookmarkIds);
		setFolderIds(selectedWorkspace.folderIds);
	}, [selectedWorkspace]);

	const handleCreate = async () => {
		setIsSaving(true);
		try {
			const id = await createWorkspace(newName);
			setSelectedId(id);
			setNewName('');
			message.success('工作区已创建');
		} catch (error) {
			message.error(error instanceof Error ? error.message : '创建失败');
		} finally {
			setIsSaving(false);
		}
	};
	const handleSave = async () => {
		if (!selectedWorkspace) return;
		setIsSaving(true);
		try {
			await updateWorkspace(selectedWorkspace.id, { name, bookmarkIds, folderIds });
			await setActiveWorkspace(selectedWorkspace.id);
			message.success('工作区已保存并切换');
			onClose();
		} catch (error) {
			message.error(error instanceof Error ? error.message : '保存失败');
		} finally {
			setIsSaving(false);
		}
	};
	const confirmDelete = () => {
		if (!selectedWorkspace) return;
		Modal.confirm({
			title: `删除工作区“${selectedWorkspace.name}”？`,
			content: '只删除首页分组，不会删除浏览器书签。',
			okText: '删除',
			okButtonProps: { danger: true },
			cancelText: '取消',
			onOk: async () => {
				await deleteWorkspace(selectedWorkspace.id);
				setSelectedId(workspaces.find(item => item.id !== selectedWorkspace.id)?.id || '');
				message.success('工作区已删除');
			}
		});
	};
	const toggleId = (
		id: string,
		checked: boolean,
		currentIds: string[],
		setIds: (ids: string[]) => void
	) => setIds(checked ? [...currentIds, id] : currentIds.filter(item => item !== id));

	return (
		<Modal
			className='workspace-manager-modal'
			title='管理首页工作区'
			open={isOpen}
			onCancel={onClose}
			width={720}
			footer={null}
			destroyOnHidden>
			<div className='space-y-4 pt-2'>
				<div className='flex gap-2'>
					<Input
						value={newName}
						onChange={event => setNewName(event.target.value)}
						onPressEnter={() => void handleCreate()}
						placeholder='新工作区名称，例如：开发'
					/>
					<button
						type='button'
						className='flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm text-white disabled:opacity-60'
						onClick={() => void handleCreate()}
						disabled={isSaving || !newName.trim()}>
						<PlusOutlined />创建
					</button>
				</div>

				{workspaces.length === 0 ? (
					<div className='theme-panel rounded-xl p-8 text-center text-sm text-[var(--text-secondary)]'>创建第一个工作区后，可选择其中显示的书签和文件夹。</div>
				) : (
					<>
						<div className='grid gap-3 sm:grid-cols-[180px_1fr]'>
							<label>
								<span className='mb-1.5 block text-xs text-[var(--text-secondary)]'>正在编辑</span>
								<Select
									className='w-full'
									value={selectedId}
									onChange={setSelectedId}
									options={workspaces.map(workspace => ({ label: workspace.name, value: workspace.id }))}
								/>
							</label>
							<label>
								<span className='mb-1.5 block text-xs text-[var(--text-secondary)]'>工作区名称</span>
								<Input value={name} onChange={event => setName(event.target.value)} />
							</label>
						</div>

						<Input.Search
							value={searchText}
							onChange={event => setSearchText(event.target.value)}
							placeholder='筛选书签或文件夹'
							allowClear
						/>

						<div className='workspace-item-picker grid gap-4 sm:grid-cols-2'>
							<section>
								<h3 className='mb-2 text-sm font-medium'>文件夹（{folderIds.length}）</h3>
								<div className='space-y-1'>
									{visibleFolders.map(({ folder, depth }) => (
										<Checkbox key={folder.id} checked={folderIds.includes(folder.id)} onChange={event => toggleId(folder.id, event.target.checked, folderIds, setFolderIds)}>
											<span style={{ paddingLeft: depth * 12 }}>{folder.title}</span>
										</Checkbox>
									))}
								</div>
							</section>
							<section>
								<h3 className='mb-2 text-sm font-medium'>书签（{bookmarkIds.length}）</h3>
								<div className='space-y-1'>
									{visibleBookmarks.map(bookmark => (
										<Checkbox key={bookmark.id} checked={bookmarkIds.includes(bookmark.id)} onChange={event => toggleId(bookmark.id, event.target.checked, bookmarkIds, setBookmarkIds)}>
											<span className='inline-block max-w-52 truncate align-bottom'>{bookmark.title || bookmark.url}</span>
										</Checkbox>
									))}
								</div>
							</section>
						</div>

						<div className='flex flex-wrap justify-between gap-2 border-t border-[var(--border-color)] pt-4'>
							<button type='button' className='theme-secondary-button flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm text-red-500' onClick={confirmDelete}>
								<DeleteOutlined />删除工作区
							</button>
							<button type='button' className='min-h-11 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white disabled:opacity-60' onClick={() => void handleSave()} disabled={isSaving || !name.trim()}>
								{isSaving ? '保存中…' : '保存并切换'}
							</button>
						</div>
					</>
				)}
			</div>
		</Modal>
	);
};
