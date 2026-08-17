import type { Bookmark } from '../types';
import type { Workspace } from '../store/workspaceStore';
import { flattenBookmarkFolders } from './bookmarkTree';

export const getWorkspaceContent = (
	bookmarks: Bookmark[],
	folders: Bookmark[],
	rootBookmarkIds: string[],
	externalBookmarkIds: string[],
	hiddenHomeFolderIds: string[],
	workspace?: Workspace
) => {
	if (!workspace) {
		const homeIds = new Set([...rootBookmarkIds, ...externalBookmarkIds]);
		const hiddenFolderIds = new Set(hiddenHomeFolderIds);
		return {
			bookmarks: bookmarks.filter(bookmark => homeIds.has(bookmark.id)),
			folders: folders.filter(folder => !hiddenFolderIds.has(folder.id))
		};
	}

	const bookmarkIds = new Set(workspace.bookmarkIds);
	const folderIds = new Set(workspace.folderIds);
	return {
		bookmarks: bookmarks.filter(bookmark => bookmarkIds.has(bookmark.id)),
		folders: flattenBookmarkFolders(folders)
			.map(item => item.folder)
			.filter(folder => folderIds.has(folder.id))
	};
};
