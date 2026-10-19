import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HOME_WORKSPACE_ID, normalizeWorkspaces, useWorkspaceStore } from './workspaceStore';

const getStorage = vi.fn<() => Promise<Record<string, unknown>>>();
const setStorage = vi.fn<(items: Record<string, unknown>) => Promise<void>>();

const home = { id: HOME_WORKSPACE_ID, name: '首页', bookmarkIds: ['root'], folderIds: ['folder'] };
const dev = { id: 'dev', name: '开发', bookmarkIds: ['shared'], folderIds: [] };

describe('workspaceStore', () => {
	beforeEach(() => {
		getStorage.mockReset().mockResolvedValue({});
		setStorage.mockReset().mockResolvedValue();
		vi.stubGlobal('chrome', { storage: { local: {
			get: getStorage, set: setStorage
		} } });
		useWorkspaceStore.setState({ workspaces: [], activeWorkspaceId: HOME_WORKSPACE_ID,
			hiddenHomeFolderIds: [], isLoaded: false, isMigrated: false });
	});
	afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

	it('迁移首页时保留根书签、外显书签及可见文件夹，不影响已有工作区', async () => {
		getStorage.mockResolvedValueOnce({ 'fasttab-workspaces': {
			workspaces: [dev], activeWorkspaceId: 'dev', hiddenHomeFolderIds: ['private']
		} });
		await useWorkspaceStore.getState().loadWorkspaces();
		await useWorkspaceStore.getState().migrateHomeWorkspace(['root', 'external', 'root'], ['folder', 'private']);
		expect(useWorkspaceStore.getState().workspaces).toEqual([
			{ ...home, bookmarkIds: ['root', 'external'] }, dev
		]);
		expect(useWorkspaceStore.getState().activeWorkspaceId).toBe('dev');
		expect(chrome.storage.local.set).toHaveBeenLastCalledWith({ 'fasttab-workspaces': expect.objectContaining({ version: 2 }) });
	});

	it('迁移只运行一次，移除根书签后重新加载不会强制恢复', async () => {
		await useWorkspaceStore.getState().loadWorkspaces();
		await useWorkspaceStore.getState().migrateHomeWorkspace(['root'], ['folder']);
		await useWorkspaceStore.getState().setWorkspaceItems('home', 'bookmarkIds', ['root'], false);
		const writes = setStorage.mock.calls;
		const stored = writes[writes.length - 1][0];
		getStorage.mockResolvedValueOnce(stored!);
		await useWorkspaceStore.getState().loadWorkspaces();
		await useWorkspaceStore.getState().migrateHomeWorkspace(['root', 'new-root'], ['folder']);
		expect(useWorkspaceStore.getState().workspaces[0].bookmarkIds).toEqual([]);
	});

	it('旧数据读取或迁移保存失败时不覆盖原配置', async () => {
		getStorage.mockRejectedValueOnce(new Error('read failed'));
		await expect(useWorkspaceStore.getState().loadWorkspaces()).rejects.toThrow('read failed');
		await useWorkspaceStore.getState().migrateHomeWorkspace(['root'], []);
		expect(chrome.storage.local.set).not.toHaveBeenCalled();
		await useWorkspaceStore.getState().loadWorkspaces();
		setStorage.mockRejectedValueOnce(new Error('write failed'));
		await expect(useWorkspaceStore.getState().migrateHomeWorkspace(['root'], [])).rejects.toThrow('write failed');
		expect(useWorkspaceStore.getState().isMigrated).toBe(false);
		await useWorkspaceStore.getState().migrateHomeWorkspace(['root'], []);
		expect(useWorkspaceStore.getState().workspaces[0].bookmarkIds).toEqual(['root']);
	});

	it('同一书签可以加入多个工作区，批量移除只改变当前工作区', async () => {
		useWorkspaceStore.setState({ workspaces: [home, dev], isMigrated: true });
		await useWorkspaceStore.getState().setWorkspaceItems('home', 'bookmarkIds', ['shared', 'shared', 'another'], true);
		await useWorkspaceStore.getState().setWorkspaceItems('dev', 'bookmarkIds', ['shared', 'missing'], false);
		expect(useWorkspaceStore.getState().workspaces[0].bookmarkIds).toEqual(['root', 'shared', 'another']);
		expect(useWorkspaceStore.getState().workspaces[1].bookmarkIds).toEqual([]);
	});

	it('连续异步操作不会覆盖彼此，文件夹入口与书签关联独立', async () => {
		useWorkspaceStore.setState({ workspaces: [home, dev] });
		await Promise.all([
			useWorkspaceStore.getState().setWorkspaceItems('dev', 'bookmarkIds', ['a'], true),
			useWorkspaceStore.getState().setWorkspaceItems('dev', 'bookmarkIds', ['b'], true),
			useWorkspaceStore.getState().setWorkspaceItems('dev', 'folderIds', ['nested'], true),
			useWorkspaceStore.getState().setWorkspaceItems('home', 'folderIds', ['folder'], false)
		]);
		expect(useWorkspaceStore.getState().workspaces[1]).toMatchObject({ bookmarkIds: ['shared', 'a', 'b'], folderIds: ['nested'] });
		expect(useWorkspaceStore.getState().workspaces[0]).toMatchObject({ bookmarkIds: ['root'], folderIds: [] });
	});

	it('保存失败保留原状态，后续操作仍可继续', async () => {
		useWorkspaceStore.setState({ workspaces: [home] });
		setStorage.mockRejectedValueOnce(new Error('failed'));
		await expect(useWorkspaceStore.getState().setWorkspaceItems('home', 'bookmarkIds', ['root'], false)).rejects.toThrow();
		expect(useWorkspaceStore.getState().workspaces[0]).toEqual(home);
		await useWorkspaceStore.getState().setWorkspaceItems('home', 'bookmarkIds', ['new'], true);
		expect(useWorkspaceStore.getState().workspaces[0].bookmarkIds).toEqual(['root', 'new']);
	});

	it('创建或重命名工作区不会切换当前展示的工作区', async () => {
		useWorkspaceStore.setState({ workspaces: [home], isMigrated: true });
		const id = await useWorkspaceStore.getState().createWorkspace('开发');
		await useWorkspaceStore.getState().updateWorkspace(id, { name: '项目' });
		expect(useWorkspaceStore.getState().activeWorkspaceId).toBe('home');
		await expect(useWorkspaceStore.getState().createWorkspace(' 首页 ')).rejects.toThrow('同名');
	});

	it('删除首页或最后一个工作区后不会重新迁移生成首页', async () => {
		useWorkspaceStore.setState({ workspaces: [home, dev], isLoaded: true, isMigrated: true });
		await useWorkspaceStore.getState().deleteWorkspace('home');
		expect(useWorkspaceStore.getState().activeWorkspaceId).toBe('dev');
		await useWorkspaceStore.getState().deleteWorkspace('dev');
		await useWorkspaceStore.getState().migrateHomeWorkspace(['root'], ['folder']);
		expect(useWorkspaceStore.getState().workspaces).toEqual([]);
		expect(useWorkspaceStore.getState().activeWorkspaceId).toBe('');
	});

	it('过滤损坏数据、去重 ID，同时允许首页作为普通工作区', () => {
		expect(normalizeWorkspaces([home, { ...home, name: '重复' },
			{ id: 'dev', name: ' 开发 ', bookmarkIds: ['a', 'a'] }, { id: 'empty', name: '  ' }
		])).toEqual([home, { id: 'dev', name: '开发', bookmarkIds: ['a'], folderIds: [] }]);
	});

	it('撤销删除获得新 ID 后，同时修正首页和其他工作区的引用', async () => {
		useWorkspaceStore.setState({ workspaces: [home, { ...dev, bookmarkIds: ['root', 'new'], folderIds: ['folder'] }] });
		await useWorkspaceStore.getState().replaceBookmarkReferences([
			{ oldId: 'root', newId: 'new', isFolder: false },
			{ oldId: 'folder', newId: 'new-folder', isFolder: true }
		]);
		for (const workspace of useWorkspaceStore.getState().workspaces) {
			expect(workspace).toMatchObject({ bookmarkIds: ['new'], folderIds: ['new-folder'] });
		}
	});
});
