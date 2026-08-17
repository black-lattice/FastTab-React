import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	HOME_WORKSPACE_ID,
	normalizeWorkspaces,
	useWorkspaceStore
} from './workspaceStore';

describe('workspaceStore', () => {
	beforeEach(() => {
		vi.stubGlobal('chrome', {
			storage: {
				local: {
					get: vi.fn(() => Promise.resolve({})),
					set: vi.fn(() => Promise.resolve())
				}
			}
		});
		useWorkspaceStore.setState({
			workspaces: [],
			activeWorkspaceId: HOME_WORKSPACE_ID,
			hiddenHomeFolderIds: [],
			isLoaded: false
		});
	});

	it('可以隐藏首页文件夹并再次恢复', async () => {
		await useWorkspaceStore.getState().setHomeFolderVisible('private', false);
		expect(useWorkspaceStore.getState().hiddenHomeFolderIds).toEqual(['private']);
		expect(chrome.storage.local.set).toHaveBeenLastCalledWith({
			'fasttab-workspaces': expect.objectContaining({
				hiddenHomeFolderIds: ['private']
			})
		});

		await useWorkspaceStore.getState().setHomeFolderVisible('private', true);
		expect(useWorkspaceStore.getState().hiddenHomeFolderIds).toEqual([]);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('过滤损坏的工作区并去重项目 ID', () => {
		expect(normalizeWorkspaces([
			{ id: 'work', name: ' 工作 ', bookmarkIds: ['a', 'a'], folderIds: ['f'] },
			{ id: 'empty', name: '  ' },
			{ id: HOME_WORKSPACE_ID, name: '重复首页' }
		])).toEqual([
			{ id: 'work', name: '工作', bookmarkIds: ['a'], folderIds: ['f'] }
		]);
	});

	it('创建工作区后自动切换并保存', async () => {
		const id = await useWorkspaceStore.getState().createWorkspace('开发');

		expect(useWorkspaceStore.getState().activeWorkspaceId).toBe(id);
		expect(useWorkspaceStore.getState().workspaces[0].name).toBe('开发');
		expect(chrome.storage.local.set).toHaveBeenCalledOnce();
	});

	it('书签恢复新 ID 后会同步修正并去重工作区引用', async () => {
		useWorkspaceStore.setState({
			workspaces: [{
				id: 'work',
				name: '工作',
				bookmarkIds: ['old-bookmark', 'kept-bookmark'],
				folderIds: ['old-folder']
			}]
		});

		await useWorkspaceStore.getState().replaceBookmarkReferences([
			{ oldId: 'old-bookmark', newId: 'kept-bookmark', isFolder: false },
			{ oldId: 'old-folder', newId: 'new-folder', isFolder: true }
		]);

		expect(useWorkspaceStore.getState().workspaces[0]).toMatchObject({
			bookmarkIds: ['kept-bookmark'],
			folderIds: ['new-folder']
		});
		expect(chrome.storage.local.set).toHaveBeenCalledOnce();
	});
});
