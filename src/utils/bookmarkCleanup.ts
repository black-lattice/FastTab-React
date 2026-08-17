import type { Bookmark } from '../types';
import { flattenBookmarkFolders } from './bookmarkTree';

const normalizeUrl = (value: string) => {
	try {
		const url = new URL(value);
		url.hash = '';
		url.hostname = url.hostname.toLowerCase();
		if (url.pathname === '/') url.pathname = '';
		return url.toString();
	} catch {
		return value.trim().toLowerCase();
	}
};

export const findDuplicateBookmarkGroups = (bookmarks: Bookmark[]) => {
	const groups = new Map<string, Bookmark[]>();
	for (const bookmark of bookmarks) {
		const key = normalizeUrl(bookmark.url);
		groups.set(key, [...(groups.get(key) || []), bookmark]);
	}
	return Array.from(groups.values())
		.filter(group => group.length > 1)
		.map(group => [...group].sort((a, b) =>
			(a.dateAdded ?? Number.MAX_SAFE_INTEGER) -
			(b.dateAdded ?? Number.MAX_SAFE_INTEGER)
		));
};

export const findEmptyFolders = (folders: Bookmark[]) =>
	flattenBookmarkFolders(folders)
		.map(item => item.folder)
		.filter(folder => !folder.children?.length);
