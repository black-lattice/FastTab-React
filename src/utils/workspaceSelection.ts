import type { Bookmark } from '../types';

export const filterWorkspaceBookmarks = (
	bookmarks: Bookmark[],
	category: string,
	rootBookmarkIds: string[],
	selectedIds: string[],
	query: string
) => {
	const rootIds = new Set(rootBookmarkIds);
	const selected = new Set(selectedIds);
	const search = query.trim().toLowerCase();
	return bookmarks.filter(bookmark => {
		const inCategory = category === 'all' ||
			(category === 'root' ? rootIds.has(bookmark.id) :
				category === 'selected' ? selected.has(bookmark.id) : bookmark.parentId === category);
		return inCategory && (!search || bookmark.title.toLowerCase().includes(search) ||
			bookmark.url.toLowerCase().includes(search));
	});
};

export const updateWorkspaceSelection = (currentIds: string[], ids: string[], checked: boolean) => {
	const changedIds = new Set(ids);
	return checked
		? Array.from(new Set([...currentIds, ...ids]))
		: currentIds.filter(id => !changedIds.has(id));
};
