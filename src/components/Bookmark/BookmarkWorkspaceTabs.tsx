import { useState } from 'react';
import { Button, Dropdown, Input, Modal, Tooltip, message } from 'antd';
import { MoreOutlined, PlusOutlined } from '@ant-design/icons';
import { useWorkspaceStore } from '../../store/workspaceStore';

interface Props {
	value: string;
	disabled: boolean;
	onChange: (id: string) => void;
}

export const BookmarkWorkspaceTabs = ({ value, disabled, onChange }: Props) => {
	const workspaces = useWorkspaceStore(state => state.workspaces);
	const createWorkspace = useWorkspaceStore(state => state.createWorkspace);
	const updateWorkspace = useWorkspaceStore(state => state.updateWorkspace);
	const deleteWorkspace = useWorkspaceStore(state => state.deleteWorkspace);
	const [editing, setEditing] = useState<'create' | 'rename' | null>(null);
	const [name, setName] = useState('');
	const [saving, setSaving] = useState(false);
	const current = workspaces.find(workspace => workspace.id === value);
	const saveName = async () => {
		if (saving) return;
		setSaving(true);
		try {
			if (editing === 'create') onChange(await createWorkspace(name));
			else if (current) await updateWorkspace(current.id, { name });
			setEditing(null);
			message.success('工作区已保存');
		} catch (error) {
			message.error(error instanceof Error ? error.message : '保存失败');
		} finally {
			setSaving(false);
		}
	};
	const remove = () => {
		if (!current) return;
		Modal.confirm({
			title: `删除工作区“${current.name}”？`,
			content: '只删除工作区及其关联，不会删除浏览器书签。若正在使用此工作区，将切换至剩余工作区。',
			okText: '删除工作区', cancelText: '取消', okButtonProps: { danger: true },
			onOk: async () => {
				try {
					await deleteWorkspace(current.id);
					onChange(useWorkspaceStore.getState().workspaces[0]?.id || '');
					message.success('工作区已删除');
				} catch {
					message.error('删除工作区失败');
					throw new Error('删除失败');
				}
			}
		});
	};
	return (
		<>
			<div className='bookmark-manager-workspaces mb-4' aria-label='选择要管理的工作区'>
				<div className='bookmark-workspace-tabs'>
					{workspaces.map(workspace => (
						<button
							key={workspace.id}
							type='button'
							className={`workspace-tab ${value === workspace.id ? 'is-active' : ''}`}
							aria-pressed={value === workspace.id}
							disabled={disabled || saving}
							onClick={() => onChange(workspace.id)}>
							{workspace.name}
						</button>
					))}
					{!workspaces.length && <span className='text-sm text-[var(--text-tertiary)]'>创建工作区后，可选择要展示的书签</span>}
				</div>
				<Tooltip title='新建工作区'>
					<Button icon={<PlusOutlined />} aria-label='新建工作区' disabled={disabled || saving}
						onClick={() => { setName(''); setEditing('create'); }} />
				</Tooltip>
				<Dropdown disabled={!current || disabled || saving} menu={{
					items: [{ key: 'rename', label: '重命名工作区' }, { key: 'delete', label: '删除工作区', danger: true }],
					onClick: ({ key }) => {
						if (key === 'delete') remove();
						else { setName(current?.name || ''); setEditing('rename'); }
					}
				}}>
					<Button icon={<MoreOutlined />} aria-label='管理当前工作区' disabled={!current || disabled || saving} />
				</Dropdown>
			</div>
			<Modal title={editing === 'create' ? '新建工作区' : '重命名工作区'} open={editing !== null}
				onCancel={() => { if (!saving) setEditing(null); }} onOk={() => void saveName()}
				okText='保存' cancelText='取消' confirmLoading={saving} okButtonProps={{ disabled: !name.trim() }}>
				<label className='block py-3'>
					<span className='mb-2 block'>工作区名称</span>
					<Input value={name} onChange={event => setName(event.target.value)} autoFocus
						onPressEnter={event => {
							if (!event.nativeEvent.isComposing && event.keyCode !== 229) void saveName();
						}} />
				</label>
			</Modal>
		</>
	);
};
