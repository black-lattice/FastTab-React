import { create } from 'zustand';
import { Bookmark, PermissionState } from '../types';
import { parseBookmarksBar } from '../utils/bookmarkTree';

const EXTERNAL_BOOKMARK_IDS_KEY = 'externalBookmarkIds';

interface LoadBookmarksOptions {
	silent?: boolean;
}

interface BookmarkState {
	bookmarks: Bookmark[];
	bookmarksBarId: string;
	folders: Bookmark[];
	rootBookmarkIds: string[];
	externalBookmarkIds: string[];
	loading: boolean;
	permissionState: PermissionState;
	checkPermission: () => Promise<boolean>;
	requestPermission: () => Promise<boolean>;
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
	moveBookmark: (
		id: string,
		destination: { parentId?: string; index?: number }
	) => Promise<void>;
	moveBookmarks: (
		ids: string[],
		destination: { parentId?: string; index?: number }
	) => Promise<void>;
	moveBookmarkOptimized: (draggedId: string, targetId: string) => Promise<void>;
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
	bookmarks: [],
	bookmarksBarId: '',
	folders: [],
	rootBookmarkIds: [],
	externalBookmarkIds: [],
	loading: true,
	permissionState: {
		hasPermission: false,
		isRequesting: false
	},

	checkPermission: async () => {
		try {
			const hasPermission = await chrome.permissions.contains({
				permissions: ['bookmarks']
			});
			set(state => ({
				permissionState: { ...state.permissionState, hasPermission }
			}));
			return hasPermission;
		} catch (error) {
			console.error('检查权限失败:', error);
			set(state => ({
				loading: false,
				permissionState: { ...state.permissionState, hasPermission: false }
			}));
			return false;
		}
	},

	requestPermission: async () => {
		set({ permissionState: { hasPermission: false, isRequesting: true } });
		try {
			const granted = await chrome.permissions.request({
				permissions: ['bookmarks']
			});
			set({
				permissionState: { hasPermission: granted, isRequesting: false }
			});
			if (granted) await get().loadBookmarks();
			return granted;
		} catch (error) {
			console.error('请求权限失败:', error);
			set({ permissionState: { hasPermission: false, isRequesting: false } });
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

			set({ ...parsedTree, externalBookmarkIds });
			if (externalBookmarkIds.length !== currentExternalBookmarkIds.length) {
				await chrome.storage.local.set({
					[EXTERNAL_BOOKMARK_IDS_KEY]: externalBookmarkIds
				});
			}
		} catch (error) {
			console.error('加载书签失败:', error);
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
		await Promise.all(ids.map(id => chrome.bookmarks.remove(id)));
		await get().setBookmarksExternal(ids, false);
		await get().loadBookmarks({ silent: true });
	},

	moveBookmark: async (id, destination) => {
		await get().moveBookmarks([id], destination);
	},

	moveBookmarks: async (ids, destination) => {
		for (const id of ids) {
			await chrome.bookmarks.move(id, destination);
		}
		await get().loadBookmarks({ silent: true });
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
			await get().loadBookmarks({ silent: true });
		} catch (error) {
			await get().loadBookmarks({ silent: true });
			console.error('移动书签失败:', error);
			throw error;
		}
	}
}));
