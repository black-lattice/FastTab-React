import { create } from 'zustand';
import { Bookmark, PermissionState } from '../types';
import { parseBookmarksBar } from '../utils/bookmarkTree';
import { useWorkspaceStore } from './workspaceStore';
import {
	captureBookmarkSnapshots,
	createUndoAction,
	restoreBookmarkAction,
	toBookmarkSnapshot,
	type BookmarkUndoAction
} from '../utils/bookmarkUndo';
const EXTERNAL_BOOKMARK_IDS_KEY = 'externalBookmarkIds';
interface LoadBookmarksOptions { silent?: boolean; }
interface BookmarkState {
	bookmarks: Bookmark[];
	bookmarksBarId: string;
	folders: Bookmark[];
	rootBookmarkIds: string[];
	externalBookmarkIds: string[];
	loading: boolean;
	error: string | null;
	lastUndoAction: BookmarkUndoAction | null;
	isUndoing: boolean;
	permissionState: PermissionState;
	checkPermission: () => Promise<boolean>;
	loadBookmarks: (options?: LoadBookmarksOptions) => Promise<void>;
	loadDisplaySettings: () => Promise<void>;
	setBookmarkExternal: (id: string, isExternal: boolean) => Promise<void>;
	setBookmarksExternal: (ids: string[], isExternal: boolean) => Promise<void>;
	createBookmark: (
		bookmark: Omit<Bookmark, 'id' | 'dateAdded'>
	) => Promise<chrome.bookmarks.BookmarkTreeNode>;
	updateBookmark: (id: string, changes: Partial<Bookmark>) => Promise<void>;
	removeBookmark: (id: string) => Promise<void>;
	removeBookmarks: (ids: string[]) => Promise<void>;
	removeEmptyFolders: (ids: string[]) => Promise<void>;
	moveBookmark: (
		id: string,
		destination: { parentId?: string; index?: number }
	) => Promise<void>;
	moveBookmarks: (
		ids: string[],
		destination: { parentId?: string; index?: number }
	) => Promise<void>;
	moveBookmarkOptimized: (draggedId: string, targetId: string) => Promise<void>;
	undoLastAction: () => Promise<void>;
	clearUndoAction: () => void;
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
	bookmarks: [],
	bookmarksBarId: '',
	folders: [],
	rootBookmarkIds: [],
	externalBookmarkIds: [],
	loading: true,
	error: null,
	lastUndoAction: null,
	isUndoing: false,
	permissionState: {
		hasPermission: false,
		isChecking: false
	},

	checkPermission: async () => {
		set(state => ({
			permissionState: { ...state.permissionState, isChecking: true }
		}));
		try {
			const hasPermission = await chrome.permissions.contains({
				permissions: ['bookmarks']
			});
			set(state => ({
				error: hasPermission ? state.error : null,
				permissionState: { hasPermission, isChecking: false }
			}));
			return hasPermission;
		} catch (error) {
			console.error('检查权限失败:', error);
			set({
				loading: false,
				error: '无法检查书签权限，请重新加载扩展后重试',
				permissionState: { hasPermission: false, isChecking: false }
			});
			return false;
		}
	},

	loadDisplaySettings: async () => {
		try {
			const result = await chrome.storage.local.get(EXTERNAL_BOOKMARK_IDS_KEY);
			set({
				externalBookmarkIds: Array.isArray(result[EXTERNAL_BOOKMARK_IDS_KEY])
					? result[EXTERNAL_BOOKMARK_IDS_KEY]
					: []
			});
		} catch (error) {
			console.error('加载书签显示设置失败:', error);
		}
	},

	setBookmarkExternal: async (id, isExternal) => {
		await get().setBookmarksExternal([id], isExternal);
	},

	setBookmarksExternal: async (ids, isExternal) => {
		const currentIds = get().externalBookmarkIds;
		const changedIds = new Set(ids);
		const externalBookmarkIds = isExternal
			? Array.from(new Set([...currentIds, ...ids]))
			: currentIds.filter(id => !changedIds.has(id));

		set({ externalBookmarkIds });
		try {
			await chrome.storage.local.set({
				[EXTERNAL_BOOKMARK_IDS_KEY]: externalBookmarkIds
			});
		} catch (error) {
			set({ externalBookmarkIds: currentIds });
			console.error('保存书签显示设置失败:', error);
			throw error;
		}
	},

	loadBookmarks: async ({ silent = false } = {}) => {
		if (!get().permissionState.hasPermission) {
			if (!silent) set({ loading: false });
			return;
		}

		if (!silent) set({ loading: true });
		try {
			const parsedTree = parseBookmarksBar(await chrome.bookmarks.getTree());
			const bookmarkIds = new Set(parsedTree.bookmarks.map(bookmark => bookmark.id));
			const currentExternalBookmarkIds = get().externalBookmarkIds;
			const externalBookmarkIds = currentExternalBookmarkIds.filter(id =>
				bookmarkIds.has(id)
			);

			set({ ...parsedTree, externalBookmarkIds, error: null });
			if (externalBookmarkIds.length !== currentExternalBookmarkIds.length) {
				await chrome.storage.local.set({
					[EXTERNAL_BOOKMARK_IDS_KEY]: externalBookmarkIds
				});
			}
		} catch (error) {
			console.error('加载书签失败:', error);
			set({ error: '书签加载失败，请检查扩展状态后重试' });
			throw error;
		} finally {
			if (!silent) set({ loading: false });
		}
	},

	createBookmark: async bookmark => {
		const newBookmark = await chrome.bookmarks.create({
			title: bookmark.title,
			url: bookmark.url,
			parentId: bookmark.parentId || get().bookmarksBarId
		});
		await get().loadBookmarks({ silent: true });
		return newBookmark;
	},

	updateBookmark: async (id, changes) => {
		await chrome.bookmarks.update(id, {
			title: changes.title,
			url: changes.url
		});
		await get().loadBookmarks({ silent: true });
	},

	removeBookmark: async id => {
		await get().removeBookmarks([id]);
	},

	removeBookmarks: async ids => {
		const externalBookmarkIds = get().externalBookmarkIds;
		const snapshots = await captureBookmarkSnapshots(ids, externalBookmarkIds);
		const results = await Promise.allSettled(
			ids.map(id => chrome.bookmarks.remove(id))
		);
		const removedIds = ids.filter((_, index) => results[index].status === 'fulfilled');
		const removedIdSet = new Set(removedIds);

		if (removedIds.length) {
			await get().setBookmarksExternal(removedIds, false);
			set({ lastUndoAction: createUndoAction(
				'delete',
				`已删除 ${removedIds.length} 个书签`,
				snapshots.filter(snapshot => removedIdSet.has(snapshot.id))
			) });
		}
		await get().loadBookmarks({ silent: true });
		if (removedIds.length !== ids.length) {
			throw new Error(`已删除 ${removedIds.length} 项，${ids.length - removedIds.length} 项删除失败`);
		}
	},

	removeEmptyFolders: async ids => {
		const snapshots = await captureBookmarkSnapshots(ids, []);
		const results = await Promise.allSettled(ids.map(id => chrome.bookmarks.remove(id)));
		const removedIds = ids.filter((_, index) => results[index].status === 'fulfilled');
		const removedIdSet = new Set(removedIds);
		if (removedIds.length) {
			set({ lastUndoAction: createUndoAction(
				'delete',
				`已删除 ${removedIds.length} 个空文件夹`,
				snapshots.filter(snapshot => removedIdSet.has(snapshot.id))
			) });
		}
		await get().loadBookmarks({ silent: true });
		if (removedIds.length !== ids.length) {
			throw new Error(`已删除 ${removedIds.length} 项，${ids.length - removedIds.length} 项删除失败`);
		}
	},

	moveBookmark: async (id, destination) => {
		await get().moveBookmarks([id], destination);
	},

	moveBookmarks: async (ids, destination) => {
		const externalBookmarkIds = get().externalBookmarkIds;
		const snapshots = await captureBookmarkSnapshots(ids, externalBookmarkIds);
		const movedIds: string[] = [];
		try {
			for (const id of ids) {
				await chrome.bookmarks.move(id, destination);
				movedIds.push(id);
			}
		} finally {
			if (movedIds.length) {
				const movedIdSet = new Set(movedIds);
				set({ lastUndoAction: createUndoAction(
					'move',
					`已移动 ${movedIds.length} 个书签`,
					snapshots.filter(snapshot => movedIdSet.has(snapshot.id))
				) });
			}
			await get().loadBookmarks({ silent: true });
		}
	},

	moveBookmarkOptimized: async (draggedId, targetId) => {
		try {
			const [draggedBookmarks, targetBookmarks] = await Promise.all([
				chrome.bookmarks.get(draggedId),
				chrome.bookmarks.get(targetId)
			]);
			const dragged = draggedBookmarks[0];
			const target = targetBookmarks[0];

			if (!dragged || !target) throw new Error('无法获取书签信息');
			if (dragged.parentId !== target.parentId) {
				throw new Error('只能调整同一文件夹中的书签顺序');
			}
			if (dragged.index === undefined || target.index === undefined) {
				throw new Error('书签顺序信息不完整');
			}

			const index = dragged.index > target.index
				? target.index
				: target.index + 1;
			if (dragged.index === index) return;

			await chrome.bookmarks.move(draggedId, {
				parentId: dragged.parentId,
				index
			});
			set({ lastUndoAction: createUndoAction(
				'move',
				'已调整书签顺序',
				[toBookmarkSnapshot(dragged, get().externalBookmarkIds)]
			) });
			await get().loadBookmarks({ silent: true });
		} catch (error) {
			await get().loadBookmarks({ silent: true });
			console.error('移动书签失败:', error);
			throw error;
		}
	},
	undoLastAction: async () => {
		const action = get().lastUndoAction;
		if (!action || get().isUndoing) return;
		set({ isUndoing: true });
		try {
			const { restoredExternalIds, references } = await restoreBookmarkAction(action);
			await useWorkspaceStore.getState().replaceBookmarkReferences(references);
			if (restoredExternalIds.length) {
				await get().setBookmarksExternal(restoredExternalIds, true);
			}
			set({ lastUndoAction: null });
			await get().loadBookmarks({ silent: true });
		} finally {
			set({ isUndoing: false });
		}
	},
	clearUndoAction: () => set({ lastUndoAction: null })
}));
