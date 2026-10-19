import { create } from 'zustand';
import type { RestoredBookmarkReference } from '../utils/bookmarkUndo';

export const HOME_WORKSPACE_ID = 'home';
const STORAGE_KEY = 'fasttab-workspaces';

export interface Workspace {
	id: string;
	name: string;
	bookmarkIds: string[];
	folderIds: string[];
}

interface StoredWorkspaceState {
	version?: number;
	activeWorkspaceId: string;
	workspaces: Workspace[];
	hiddenHomeFolderIds: string[];
}

const normalizeIds = (value: unknown): string[] =>
	Array.isArray(value)
		? Array.from(new Set(value.filter((id): id is string => typeof id === 'string')))
		: [];

export const normalizeWorkspaces = (value: unknown): Workspace[] => {
	if (!Array.isArray(value)) return [];
	const seen = new Set<string>();
	return value.flatMap(item => {
		if (!item || typeof item !== 'object') return [];
		const workspace = item as Partial<Workspace>;
		if (typeof workspace.id !== 'string' || typeof workspace.name !== 'string') return [];
		const name = workspace.name.trim();
		if (!name || !workspace.id || seen.has(workspace.id)) return [];
		seen.add(workspace.id);
		return [{
			id: workspace.id,
			name,
			bookmarkIds: normalizeIds(workspace.bookmarkIds),
			folderIds: normalizeIds(workspace.folderIds)
		}];
	});
};

interface WorkspaceState {
	workspaces: Workspace[];
	activeWorkspaceId: string;
	hiddenHomeFolderIds: string[];
	isLoaded: boolean;
	isMigrated: boolean;
	loadWorkspaces: () => Promise<void>;
	migrateHomeWorkspace: (bookmarkIds: string[], folderIds: string[]) => Promise<void>;
	createWorkspace: (name: string) => Promise<string>;
	updateWorkspace: (id: string, changes: Partial<Omit<Workspace, 'id'>>) => Promise<void>;
	deleteWorkspace: (id: string) => Promise<void>;
	setActiveWorkspace: (id: string) => Promise<void>;
	setWorkspaceItems: (id: string, kind: 'bookmarkIds' | 'folderIds', ids: string[], included: boolean) => Promise<void>;
	replaceBookmarkReferences: (references: RestoredBookmarkReference[]) => Promise<void>;
}

// 串行保存，避免连续切换开关时后一次写入覆盖前一次操作。
let pendingWrite: Promise<unknown> = Promise.resolve();
const enqueue = <T,>(action: () => Promise<T>): Promise<T> => {
	const task = pendingWrite.then(action);
	pendingWrite = task.catch(() => undefined);
	return task;
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => {
	const save = async (changes: Partial<WorkspaceState>) => {
		const next = { ...get(), ...changes };
		await chrome.storage.local.set({ [STORAGE_KEY]: {
			version: next.isMigrated ? 2 : 1,
			workspaces: next.workspaces,
			activeWorkspaceId: next.activeWorkspaceId,
			hiddenHomeFolderIds: next.hiddenHomeFolderIds
		} });
		set(changes);
	};
	const validateName = (name: string, id?: string) => {
		const normalized = name.trim();
		if (!normalized) throw new Error('请输入工作区名称');
		if (get().workspaces.some(item => item.id !== id && item.name === normalized)) {
			throw new Error('已存在同名工作区');
		}
		return normalized;
	};
	return {
		workspaces: [],
		activeWorkspaceId: HOME_WORKSPACE_ID,
		hiddenHomeFolderIds: [],
		isLoaded: false,
		isMigrated: false,

		loadWorkspaces: async () => {
			const result = await chrome.storage.local.get([STORAGE_KEY]);
			const stored = result[STORAGE_KEY] as Partial<StoredWorkspaceState> | undefined;
			const workspaces = normalizeWorkspaces(stored?.workspaces);
			const isMigrated = stored?.version === 2;
			const activeWorkspaceId = workspaces.some(item => item.id === stored?.activeWorkspaceId)
				? stored?.activeWorkspaceId as string
				: isMigrated ? workspaces[0]?.id || '' : HOME_WORKSPACE_ID;
			set({ workspaces, activeWorkspaceId, isMigrated, isLoaded: true,
				hiddenHomeFolderIds: normalizeIds(stored?.hiddenHomeFolderIds) });
		},

		migrateHomeWorkspace: (bookmarkIds, folderIds) => enqueue(async () => {
			if (!get().isLoaded || get().isMigrated) return;
			const home: Workspace = {
				id: HOME_WORKSPACE_ID, name: '首页',
				bookmarkIds: normalizeIds(bookmarkIds),
				folderIds: normalizeIds(folderIds).filter(id => !get().hiddenHomeFolderIds.includes(id))
			};
			const workspaces = get().workspaces.some(item => item.id === HOME_WORKSPACE_ID)
				? get().workspaces : [home, ...get().workspaces];
			await save({ workspaces, isMigrated: true });
		}),

		createWorkspace: name => enqueue(async () => {
			const workspace: Workspace = {
				id: `workspace-${crypto.randomUUID()}`, name: validateName(name),
				bookmarkIds: [], folderIds: []
			};
			await save({ workspaces: [...get().workspaces, workspace],
				activeWorkspaceId: get().activeWorkspaceId || workspace.id });
			return workspace.id;
		}),

		updateWorkspace: (id, changes) => enqueue(async () => {
			if (!get().workspaces.some(item => item.id === id)) throw new Error('工作区不存在');
			const name = changes.name === undefined ? undefined : validateName(changes.name, id);
			const workspaces = get().workspaces.map(workspace => workspace.id === id ? {
				...workspace, name: name ?? workspace.name,
				bookmarkIds: changes.bookmarkIds ? normalizeIds(changes.bookmarkIds) : workspace.bookmarkIds,
				folderIds: changes.folderIds ? normalizeIds(changes.folderIds) : workspace.folderIds
			} : workspace);
			await save({ workspaces });
		}),

		setWorkspaceItems: (id, kind, ids, included) => enqueue(async () => {
			if (!get().workspaces.some(item => item.id === id)) throw new Error('工作区不存在');
			const changedIds = new Set(ids);
			const workspaces = get().workspaces.map(workspace => workspace.id === id ? {
				...workspace,
				[kind]: included ? normalizeIds([...workspace[kind], ...ids])
					: workspace[kind].filter(item => !changedIds.has(item))
			} : workspace);
			await save({ workspaces });
		}),

		deleteWorkspace: id => enqueue(async () => {
			const workspaces = get().workspaces.filter(workspace => workspace.id !== id);
			await save({ workspaces, activeWorkspaceId: get().activeWorkspaceId === id
				? workspaces[0]?.id || '' : get().activeWorkspaceId });
		}),

		setActiveWorkspace: id => enqueue(async () => {
			if (!get().workspaces.some(item => item.id === id)) return;
			await save({ activeWorkspaceId: id });
		}),

		replaceBookmarkReferences: references => enqueue(async () => {
			if (!references.length) return;
			const bookmarks = new Map(references.filter(item => !item.isFolder).map(item => [item.oldId, item.newId]));
			const folders = new Map(references.filter(item => item.isFolder).map(item => [item.oldId, item.newId]));
			await save({ workspaces: get().workspaces.map(workspace => ({ ...workspace,
				bookmarkIds: normalizeIds(workspace.bookmarkIds.map(id => bookmarks.get(id) || id)),
				folderIds: normalizeIds(workspace.folderIds.map(id => folders.get(id) || id))
			})), hiddenHomeFolderIds: normalizeIds(get().hiddenHomeFolderIds.map(id => folders.get(id) || id)) });
		})
	};
});
