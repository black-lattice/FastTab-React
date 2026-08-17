export interface BookmarkSnapshot {
	id: string;
	title: string;
	url?: string;
	parentId?: string;
	index?: number;
	isExternal: boolean;
}

export interface BookmarkUndoAction {
	key: number;
	kind: 'delete' | 'move';
	label: string;
	bookmarks: BookmarkSnapshot[];
}

export interface RestoredBookmarkReference {
	oldId: string;
	newId: string;
	isFolder: boolean;
}

export interface RestoreBookmarkResult {
	restoredExternalIds: string[];
	references: RestoredBookmarkReference[];
}

export const toBookmarkSnapshot = (
	node: chrome.bookmarks.BookmarkTreeNode,
	externalBookmarkIds: string[]
): BookmarkSnapshot => ({
	id: node.id,
	title: node.title,
	url: node.url,
	parentId: node.parentId,
	index: node.index,
	isExternal: externalBookmarkIds.includes(node.id)
});

export const captureBookmarkSnapshots = async (
	ids: string[],
	externalBookmarkIds: string[]
) => {
	const nodes = (await Promise.all(ids.map(id => chrome.bookmarks.get(id)))).flat();
	return nodes.map(node => toBookmarkSnapshot(node, externalBookmarkIds));
};

export const createUndoAction = (
	kind: BookmarkUndoAction['kind'],
	label: string,
	bookmarks: BookmarkSnapshot[]
): BookmarkUndoAction => ({
	key: Date.now(),
	kind,
	label,
	bookmarks
});

export const restoreBookmarkAction = async (
	action: BookmarkUndoAction
): Promise<RestoreBookmarkResult> => {
	const snapshots = [...action.bookmarks].sort(
		(a, b) => (a.index ?? 0) - (b.index ?? 0)
	);
	if (action.kind === 'move') {
		for (const snapshot of snapshots) {
			await chrome.bookmarks.move(snapshot.id, {
				parentId: snapshot.parentId,
				index: snapshot.index
			});
		}
		return { restoredExternalIds: [], references: [] };
	}

	const restoredExternalIds: string[] = [];
	const references: RestoredBookmarkReference[] = [];
	for (const snapshot of snapshots) {
		const restored = await chrome.bookmarks.create({
			title: snapshot.title,
			url: snapshot.url || undefined,
			parentId: snapshot.parentId,
			index: snapshot.index
		});
		if (snapshot.isExternal) restoredExternalIds.push(restored.id);
		references.push({
			oldId: snapshot.id,
			newId: restored.id,
			isFolder: !snapshot.url
		});
	}
	return { restoredExternalIds, references };
};
