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
	activeWorkspaceId: string;
	workspaces: Workspace[];
	hiddenHomeFolderIds: string[];
}

const normalizeIds = (value: unknown) =>
	Array.isArray(value)
		? Array.from(new Set(value.filter((id): id is string => typeof id === 'string')))
		: [];

export const normalizeWorkspaces = (value: unknown): Workspace[] => {
	if (!Array.isArray(value)) return [];
	return value.flatMap(item => {
		if (!item || typeof item !== 'object') return [];
		const workspace = item as Partial<Workspace>;
		if (typeof workspace.id !== 'string' || typeof workspace.name !== 'string') return [];
		const name = workspace.name.trim();
		if (!name || workspace.id === HOME_WORKSPACE_ID) return [];
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
	loadWorkspaces: () => Promise<void>;
	createWorkspace: (name: string) => Promise<string>;
	updateWorkspace: (id: string, changes: Partial<Omit<Workspace, 'id'>>) => Promise<void>;
	deleteWorkspace: (id: string) => Promise<void>;
	setActiveWorkspace: (id: string) => Promise<void>;
	setHomeFolderVisible: (id: string, visible: boolean) => Promise<void>;
	replaceBookmarkReferences: (references: RestoredBookmarkReference[]) => Promise<void>;
}

const persist = async (state: StoredWorkspaceState) => {
	await chrome.storage.local.set({ [STORAGE_KEY]: state });
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
	workspaces: [],
	activeWorkspaceId: HOME_WORKSPACE_ID,
	hiddenHomeFolderIds: [],
	isLoaded: false,

	loadWorkspaces: async () => {
		try {
			const result = await chrome.storage.local.get([STORAGE_KEY]);
			const stored = result[STORAGE_KEY] as Partial<StoredWorkspaceState> | undefined;
			const workspaces = normalizeWorkspaces(stored?.workspaces);
			const activeWorkspaceId = workspaces.some(item => item.id === stored?.activeWorkspaceId)
				? stored?.activeWorkspaceId as string
				: HOME_WORKSPACE_ID;
			set({
				workspaces,
				activeWorkspaceId,
				hiddenHomeFolderIds: normalizeIds(stored?.hiddenHomeFolderIds)
			});
		} catch (error) {
			console.error('加载工作区失败:', error);
		} finally {
			set({ isLoaded: true });
		}
	},

	createWorkspace: async name => {
		const normalizedName = name.trim();
		if (!normalizedName) throw new Error('请输入工作区名称');
		const id = `workspace-${Date.now()}`;
		const workspace: Workspace = {
			id,
			name: normalizedName,
			bookmarkIds: [],
			folderIds: []
		};
		const workspaces = [...get().workspaces, workspace];
		await persist({
			workspaces,
			activeWorkspaceId: id,
			hiddenHomeFolderIds: get().hiddenHomeFolderIds
		});
		set({ workspaces, activeWorkspaceId: id });
		return id;
	},

	updateWorkspace: async (id, changes) => {
		const workspaces = get().workspaces.map(workspace =>
			workspace.id === id
				? {
					...workspace,
					...changes,
					name: changes.name?.trim() || workspace.name,
					bookmarkIds: changes.bookmarkIds
						? normalizeIds(changes.bookmarkIds)
						: workspace.bookmarkIds,
					folderIds: changes.folderIds
						? normalizeIds(changes.folderIds)
						: workspace.folderIds
				}
				: workspace
		);
		await persist({
			workspaces,
			activeWorkspaceId: get().activeWorkspaceId,
			hiddenHomeFolderIds: get().hiddenHomeFolderIds
		});
		set({ workspaces });
	},

	deleteWorkspace: async id => {
		const workspaces = get().workspaces.filter(workspace => workspace.id !== id);
		const activeWorkspaceId = get().activeWorkspaceId === id
			? HOME_WORKSPACE_ID
			: get().activeWorkspaceId;
		await persist({
			workspaces,
			activeWorkspaceId,
			hiddenHomeFolderIds: get().hiddenHomeFolderIds
		});
		set({ workspaces, activeWorkspaceId });
	},

	setActiveWorkspace: async id => {
		const activeWorkspaceId = id === HOME_WORKSPACE_ID || get().workspaces.some(item => item.id === id)
			? id
			: HOME_WORKSPACE_ID;
		await persist({
			workspaces: get().workspaces,
			activeWorkspaceId,
			hiddenHomeFolderIds: get().hiddenHomeFolderIds
		});
		set({ activeWorkspaceId });
	},

	setHomeFolderVisible: async (id, visible) => {
		const previousIds = get().hiddenHomeFolderIds;
		const hiddenHomeFolderIds = visible
			? previousIds.filter(folderId => folderId !== id)
			: normalizeIds([...previousIds, id]);
		set({ hiddenHomeFolderIds });
		try {
			await persist({
				workspaces: get().workspaces,
				activeWorkspaceId: get().activeWorkspaceId,
				hiddenHomeFolderIds
			});
		} catch (error) {
			set({ hiddenHomeFolderIds: previousIds });
			throw error;
		}
	},

	replaceBookmarkReferences: async references => {
		if (!references.length) return;
		const bookmarkReferences = new Map(
			references.filter(item => !item.isFolder).map(item => [item.oldId, item.newId])
		);
		const folderReferences = new Map(
			references.filter(item => item.isFolder).map(item => [item.oldId, item.newId])
		);
		const workspaces = get().workspaces.map(workspace => ({
			...workspace,
			bookmarkIds: normalizeIds(
				workspace.bookmarkIds.map(id => bookmarkReferences.get(id) || id)
			),
			folderIds: normalizeIds(
				workspace.folderIds.map(id => folderReferences.get(id) || id)
			)
		}));
		const hiddenHomeFolderIds = normalizeIds(
			get().hiddenHomeFolderIds.map(id => folderReferences.get(id) || id)
		);
		await persist({
			workspaces,
			activeWorkspaceId: get().activeWorkspaceId,
			hiddenHomeFolderIds
		});
		set({ workspaces, hiddenHomeFolderIds });
	}
}));
