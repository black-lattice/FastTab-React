import { useState, useEffect, useCallback } from 'react';
import { Bookmark, PermissionState } from '../types';

export const useBookmarks = () => {
	const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
	const [folders, setFolders] = useState<Bookmark[]>([]);
	const [loading, setLoading] = useState(true);
	const [permissionState, setPermissionState] = useState<PermissionState>({
		hasPermission: false,
		isRequesting: false
	});

	// 检查权限
	const checkPermission = useCallback(async () => {
		try {
			const hasPermission = await chrome.permissions.contains({
				permissions: ['bookmarks']
			});
			setPermissionState((prev) => ({ ...prev, hasPermission }));
			return hasPermission;
		} catch (error) {
			console.error('检查权限失败:', error);
			return false;
		}
	}, []);

	// 请求权限
	const requestPermission = useCallback(async () => {
		setPermissionState((_prev) => ({
			hasPermission: false,
			isRequesting: true
		}));
		try {
			const granted = await chrome.permissions.request({
				permissions: ['bookmarks']
			});
			setPermissionState((_prev) => ({
				hasPermission: granted,
				isRequesting: false
			}));
			return granted;
		} catch (error) {
			console.error('请求权限失败:', error);
			setPermissionState((_prev) => ({
				hasPermission: false,
				isRequesting: false
			}));
			return false;
		}
	}, []);

	// 加载书签
	const loadBookmarks = useCallback(async () => {
		if (!permissionState.hasPermission) return;

		try {
			setLoading(true);
			const tree = await chrome.bookmarks.getTree();
			const rootFolders: Bookmark[] = [];

			// 查找书签栏节点（通常是ID为'1'的节点）
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
				// 处理书签栏内的文件夹作为第一层
				bookmarksBar.children.forEach((child: any) => {
					const processNode = (node: any): Bookmark | null => {
						if (node.url) {
							// 这是一个书签
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
							// 这是一个文件夹
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

							// 递归处理子节点，但只收集书签，不收集子文件夹
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

			// 展平所有书签用于搜索和其他用途
			const allBookmarks: Bookmark[] = [];
			const flattenBookmarks = (folders: Bookmark[]) => {
				folders.forEach((folder) => {
					if (folder.children) {
						folder.children.forEach((child) => {
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

			setBookmarks(allBookmarks);
			setFolders(rootFolders);
		} catch (error) {
			console.error('加载书签失败:', error);
		} finally {
			setLoading(false);
		}
	}, [permissionState.hasPermission]);

	// 创建书签
	const createBookmark = useCallback(
		async (bookmark: Omit<Bookmark, 'id' | 'dateAdded'>) => {
			try {
				const newBookmark = await chrome.bookmarks.create({
					title: bookmark.title,
					url: bookmark.url,
					parentId: bookmark.parentId
				});
				await loadBookmarks();
				return newBookmark;
			} catch (error) {
				console.error('创建书签失败:', error);
				throw error;
			}
		},
		[loadBookmarks]
	);

	// 更新书签
	const updateBookmark = useCallback(
		async (id: string, changes: Partial<Bookmark>) => {
			try {
				await chrome.bookmarks.update(id, changes);
				await loadBookmarks();
			} catch (error) {
				console.error('更新书签失败:', error);
				throw error;
			}
		},
		[loadBookmarks]
	);

	// 删除书签
	const removeBookmark = useCallback(
		async (id: string) => {
			try {
				await chrome.bookmarks.remove(id);
				await loadBookmarks();
			} catch (error) {
				console.error('删除书签失败:', error);
				throw error;
			}
		},
		[loadBookmarks]
	);

	// 移动书签
	const moveBookmark = useCallback(
		async (id: string, destination: { parentId?: string; index?: number }) => {
			try {
				await chrome.bookmarks.move(id, destination);
				await loadBookmarks();
			} catch (error) {
				console.error('移动书签失败:', error);
				throw error;
			}
		},
		[loadBookmarks]
	);

	// 优化后的书签移动函数，用于局部状态更新
	const moveBookmarkOptimized = useCallback(
		async (draggedId: string, targetId: string) => {
			try {
				// 获取拖拽书签和目标书签的详细信息
				const [draggedBookmark, targetBookmark] = await Promise.all([
					chrome.bookmarks.get(draggedId),
					chrome.bookmarks.get(targetId)
				]);

				if (!draggedBookmark[0] || !targetBookmark[0]) {
					throw new Error('无法获取书签信息');
				}

				const dragged = draggedBookmark[0];
				const target = targetBookmark[0];

				// 确保两个书签在同一个父文件夹中
				if (dragged.parentId !== target.parentId) {
					throw new Error('书签不在同一个文件夹中');
				}

				// 计算新的索引位置
				if (dragged.index === undefined || target.index === undefined) {
					throw new Error('书签索引不存在');
				}
				let newIndex =
					dragged.index > target.index ? target.index : target.index + 1;

				// 如果位置相同，不需要移动
				if (dragged.index === newIndex) {
					return;
				}

				// 调用Chrome API移动书签
				await chrome.bookmarks.move(draggedId, {
					parentId: dragged.parentId,
					index: newIndex
				});

				// 局部更新状态，避免完全重新加载
				setBookmarks((prev) => {
					const newBookmarks = [...prev];
					const draggedIndex = newBookmarks.findIndex(
						(b) => b.id === draggedId
					);
					const targetIndex = newBookmarks.findIndex((b) => b.id === targetId);

					if (draggedIndex !== -1 && targetIndex !== -1) {
						// 移动书签到新位置
						const [movedBookmark] = newBookmarks.splice(draggedIndex, 1);
						const insertIndex =
							draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
						newBookmarks.splice(insertIndex, 0, movedBookmark);
					}

					return newBookmarks;
				});

				// 局部更新文件夹结构
				setFolders((prev) => {
					return prev.map((folder) => {
						if (
							folder.children &&
							folder.children.some((child) => child.id === draggedId)
						) {
							const newChildren = [...folder.children];
							const draggedIndex = newChildren.findIndex(
								(child) => child.id === draggedId
							);
							const targetIndex = newChildren.findIndex(
								(child) => child.id === targetId
							);

							if (draggedIndex !== -1 && targetIndex !== -1) {
								const [movedBookmark] = newChildren.splice(draggedIndex, 1);
								const insertIndex =
									draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
								newChildren.splice(insertIndex, 0, movedBookmark);
							}

							return { ...folder, children: newChildren };
						}
						return folder;
					});
				});
			} catch (error) {
				console.error('优化移动书签失败:', error);
				// 如果优化移动失败，回退到完全重新加载
				await loadBookmarks();
			}
		},
		[loadBookmarks]
	);

	// 初始化
	useEffect(() => {
		const init = async () => {
			const hasPermission = await checkPermission();
			if (hasPermission) {
				await loadBookmarks();
			}
		};
		init();
	}, [checkPermission, loadBookmarks]);

	return {
		bookmarks,
		folders,
		loading,
		permissionState,
		checkPermission,
		requestPermission,
		loadBookmarks,
		createBookmark,
		updateBookmark,
		removeBookmark,
		moveBookmark,
		moveBookmarkOptimized
	};
};
