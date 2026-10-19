import type { Bookmark } from '../types';
import type { Workspace } from '../store/workspaceStore';
import { flattenBookmarkFolders } from './bookmarkTree';

export const getWorkspaceContent = (
	bookmarks: Bookmark[],
	folders: Bookmark[],
	workspace?: Workspace
) => {
	if (!workspace) return { bookmarks: [], folders: [] };

	const bookmarkIds = new Set(workspace.bookmarkIds);
	const folderIds = new Set(workspace.folderIds);
	return {
		bookmarks: bookmarks.filter(bookmark => bookmarkIds.has(bookmark.id)),
		folders: flattenBookmarkFolders(folders)
			.map(item => item.folder)
			.filter(folder => folderIds.has(folder.id))
	};
};
