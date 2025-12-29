import { create } from 'zustand';
import { Bookmark, PermissionState } from '../types';

interface BookmarkState {
	bookmarks: Bookmark[];
	folders: Bookmark[];
	loading: boolean;
	permissionState: PermissionState;
	checkPermission: () => Promise<boolean>;
	requestPermission: () => Promise<boolean>;
	loadBookmarks: () => Promise<void>;
	createBookmark: (
		bookmark: Omit<Bookmark, 'id' | 'dateAdded'>
	) => Promise<chrome.bookmarks.BookmarkTreeNode>;
	updateBookmark: (id: string, changes: Partial<Bookmark>) => Promise<void>;
	removeBookmark: (id: string) => Promise<void>;
	moveBookmark: (
		id: string,
		destination: { parentId?: string; index?: number }
	) => Promise<void>;
	moveBookmarkOptimized: (draggedId: string, targetId: string) => Promise<void>;
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
	bookmarks: [],
	folders: [],
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
			set((state: BookmarkState) => ({
				permissionState: { ...state.permissionState, hasPermission }
			}));
			return hasPermission;
		} catch (error) {
			console.error('检查权限失败:', error);
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
			return granted;
		} catch (error) {
			console.error('请求权限失败:', error);
			set({ permissionState: { hasPermission: false, isRequesting: false } });
			return false;
		}
	},

	loadBookmarks: async () => {
		const { permissionState } = get();
		if (!permissionState.hasPermission) return;

		set({ loading: true });
		try {
			const tree = await chrome.bookmarks.getTree();
			const rootFolders: Bookmark[] = [];

			const findBookmarksBar = (nodes: any[]): any | null => {
				for (const node of nodes) {
					if (node.id === '1') {
						return node;
					}
					if (node.children) {
						const found = findBookmarksBar(node.children);
						if (found) return found;
					}
				}
				return null;
			};

			const bookmarksBar = findBookmarksBar(tree);

			if (bookmarksBar && bookmarksBar.children) {
				bookmarksBar.children.forEach((child: any) => {
					const processNode = (node: any): Bookmark | null => {
						if (node.url) {
							return {
								id: node.id,
								title: node.title,
								url: node.url,
								parentId: node.parentId,
								dateAdded: node.dateAdded,
								dateGroupModified: node.dateGroupModified,
								index: node.index
							};
						} else {
							const folder: Bookmark = {
								id: node.id,
								title: node.title,
								url: '',
								parentId: node.parentId,
								dateAdded: node.dateAdded,
								dateGroupModified: node.dateGroupModified,
								index: node.index,
								children: []
							};

							if (node.children) {
								node.children.forEach((child: any) => {
									const childBookmark = processNode(child);
									if (childBookmark) {
										folder.children!.push(childBookmark);
									}
								});
							}
							return folder;
						}
					};

					const processedFolder = processNode(child);
					if (processedFolder && !processedFolder.url) {
						rootFolders.push(processedFolder);
					}
				});
			}

			const allBookmarks: Bookmark[] = [];
			const flattenBookmarks = (folders: Bookmark[]) => {
				folders.forEach(folder => {
					if (folder.children) {
						folder.children.forEach(child => {
							if (child.url) {
								allBookmarks.push(child);
							} else if (child.children) {
								flattenBookmarks([child]);
							}
						});
					}
				});
			};
			flattenBookmarks(rootFolders);

			set({ bookmarks: allBookmarks, folders: rootFolders });
		} catch (error) {
			console.error('加载书签失败:', error);
		} finally {
			set({ loading: false });
		}
	},

	createBookmark: async (bookmark: Omit<Bookmark, 'id' | 'dateAdded'>) => {
		try {
			const newBookmark = await chrome.bookmarks.create({
				title: bookmark.title,
				url: bookmark.url,
				parentId: bookmark.parentId
			});
			await get().loadBookmarks(); // Reload all bookmarks after creation
			return newBookmark;
		} catch (error) {
			console.error('创建书签失败:', error);
			throw error;
		}
	},

	updateBookmark: async (id: string, changes: Partial<Bookmark>) => {
		try {
			await chrome.bookmarks.update(id, changes);
			await get().loadBookmarks(); // Reload all bookmarks after update
		} catch (error) {
			console.error('更新书签失败:', error);
			throw error;
		}
	},

	removeBookmark: async (id: string) => {
		try {
			await chrome.bookmarks.remove(id);
			await get().loadBookmarks(); // Reload all bookmarks after removal
		} catch (error) {
			console.error('删除书签失败:', error);
			throw error;
		}
	},

	moveBookmark: async (
		id: string,
		destination: { parentId?: string; index?: number }
	) => {
		try {
			await chrome.bookmarks.move(id, destination);
			await get().loadBookmarks(); // Reload all bookmarks after move
		} catch (error) {
			console.error('移动书签失败:', error);
			throw error;
		}
	},

	moveBookmarkOptimized: async (draggedId: string, targetId: string) => {
		try {
			const [draggedBookmark, targetBookmark] = await Promise.all([
				chrome.bookmarks.get(draggedId),
				chrome.bookmarks.get(targetId)
			]);

			if (!draggedBookmark[0] || !targetBookmark[0]) {
				throw new Error('无法获取书签信息');
			}

			const dragged = draggedBookmark[0];
			const target = targetBookmark[0];

			if (dragged.parentId !== target.parentId) {
				throw new Error('书签不在同一个文件夹中');
			}

			if (dragged.index === undefined || target.index === undefined) {
				throw new Error('书签索引不存在');
			}

			let newIndex =
				dragged.index > target.index ? target.index : target.index + 1;
			if (dragged.index === newIndex) {
				return;
			}

			await chrome.bookmarks.move(draggedId, {
				parentId: dragged.parentId,
				index: newIndex
			});

			set((state: BookmarkState) => {
				const newBookmarks = [...state.bookmarks];
				const draggedIndex = newBookmarks.findIndex(b => b.id === draggedId);
				const targetIndex = newBookmarks.findIndex(b => b.id === targetId);

				if (draggedIndex !== -1 && targetIndex !== -1) {
					const [movedBookmark] = newBookmarks.splice(draggedIndex, 1);
					const insertIndex = targetIndex;
					newBookmarks.splice(insertIndex, 0, movedBookmark);
				}
				return { bookmarks: newBookmarks };
			});

			set((state: BookmarkState) => {
				return {
					folders: state.folders.map((folder: Bookmark) => {
						if (
							folder.children &&
							folder.children.some((child: Bookmark) => child.id === draggedId)
						) {
							const newChildren = [...folder.children];
							const draggedChildIndex = newChildren.findIndex(
								child => child.id === draggedId
							);
							const targetChildIndex = newChildren.findIndex(
								child => child.id === targetId
							);

							if (draggedChildIndex !== -1 && targetChildIndex !== -1) {
								const [movedBookmark] = newChildren.splice(
									draggedChildIndex,
									1
								);
								const insertIndex = targetChildIndex;
								newChildren.splice(insertIndex, 0, movedBookmark);
							}
							return { ...folder, children: newChildren };
						}
						return folder;
					})
				};
			});
		} catch (error) {
			console.error('优化移动书签失败:', error);
			await get().loadBookmarks();
		}
	}
}));
