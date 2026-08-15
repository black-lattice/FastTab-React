import type { Bookmark } from '../types';

export interface ParsedBookmarkTree {
	bookmarks: Bookmark[];
	bookmarksBarId: string;
	folders: Bookmark[];
	rootBookmarkIds: string[];
}

export interface FlatBookmarkFolder {
	depth: number;
	folder: Bookmark;
}

export const flattenBookmarkFolders = (
	folders: Bookmark[],
	depth = 0
): FlatBookmarkFolder[] =>
	folders.flatMap(folder => [
		{ folder, depth },
		...flattenBookmarkFolders(
			folder.children?.filter(child => !child.url) || [],
			depth + 1
		)
	]);

const toBookmark = (
	node: chrome.bookmarks.BookmarkTreeNode
): Bookmark => ({
	id: node.id,
	title: node.title,
	url: node.url || '',
	parentId: node.parentId,
	dateAdded: node.dateAdded,
	dateGroupModified: node.dateGroupModified,
	index: node.index,
	children: node.children?.map(toBookmark)
});

const flattenBookmarks = (nodes: Bookmark[]): Bookmark[] =>
	nodes.flatMap(node =>
		node.url
			? [node]
			: flattenBookmarks(node.children || [])
	);

export const parseBookmarksBar = (
	tree: chrome.bookmarks.BookmarkTreeNode[]
): ParsedBookmarkTree => {
	const root = tree[0];
	const bookmarksBar =
		root?.children?.find(node => node.id === '1') || root?.children?.[0];

	if (!bookmarksBar) {
		return {
			bookmarks: [],
			bookmarksBarId: '',
			folders: [],
			rootBookmarkIds: []
		};
	}

	const rootItems = (bookmarksBar.children || []).map(toBookmark);
	const folders = rootItems.filter(item => !item.url);
	const rootBookmarks = rootItems.filter(item => Boolean(item.url));

	return {
		bookmarks: [
			...rootBookmarks,
			...flattenBookmarks(folders)
		],
		bookmarksBarId: bookmarksBar.id,
		folders,
		rootBookmarkIds: rootBookmarks.map(bookmark => bookmark.id)
	};
};
