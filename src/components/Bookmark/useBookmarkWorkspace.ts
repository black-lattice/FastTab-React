import { useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { useWorkspaceStore } from '../../store/workspaceStore';

export const useBookmarkWorkspace = () => {
	const workspaces = useWorkspaceStore(state => state.workspaces);
	const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId);
	const isMigrated = useWorkspaceStore(state => state.isMigrated);
	const setWorkspaceItems = useWorkspaceStore(state => state.setWorkspaceItems);
	const [workspaceId, setWorkspaceId] = useState(activeWorkspaceId);
	const [saving, setSaving] = useState(false);
	const savingRef = useRef(false);
	const workspace = workspaces.find(item => item.id === workspaceId);
	useEffect(() => {
		if (!workspaces.some(item => item.id === workspaceId)) {
			setWorkspaceId(workspaces[0]?.id || '');
		}
	}, [workspaces, workspaceId]);
	const bookmarkIds = useMemo(() => new Set(workspace?.bookmarkIds || []), [workspace]);
	const folderIds = useMemo(() => new Set(workspace?.folderIds || []), [workspace]);
	const setIncluded = async (kind: 'bookmarkIds' | 'folderIds', ids: string[], included: boolean) => {
		if (!workspace || !isMigrated || savingRef.current) return false;
		savingRef.current = true;
		setSaving(true);
		try {
			await setWorkspaceItems(workspace.id, kind, ids, included);
			message.success(included ? `已加入“${workspace.name}”` : `已从“${workspace.name}”移除`);
			return true;
		} catch {
			message.error('工作区设置保存失败，请重试');
			return false;
		} finally {
			savingRef.current = false;
			setSaving(false);
		}
	};
	return { workspace, workspaceId, setWorkspaceId, bookmarkIds, folderIds, saving, isMigrated, setIncluded };
};
