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
    moveBookmark
  };
};
