import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBookmarkStore } from './bookmarkStore';

const bookmarkNode = (
	id: string,
	index: number
): chrome.bookmarks.BookmarkTreeNode => ({
	id,
	title: id,
	url: `https://${id}.test`,
	parentId: '1',
	index
});

describe('bookmarkStore 静默同步', () => {
	beforeEach(() => {
		const first = bookmarkNode('first', 0);
		const second = bookmarkNode('second', 1);

		vi.stubGlobal('chrome', {
			bookmarks: {
				get: vi.fn((id: string) =>
					Promise.resolve([id === first.id ? first : second])
				),
				move: vi.fn(() => Promise.resolve(first)),
				getTree: vi.fn(() =>
					Promise.resolve([
						{
							id: '0',
							title: 'root',
							children: [
								{
									id: '1',
									title: 'Bookmarks bar',
									children: [second, first]
								}
							]
						}
					]))
			},
			storage: {
				local: {
					set: vi.fn(() => Promise.resolve())
				}
			}
		});

		useBookmarkStore.setState({
			bookmarks: [],
			bookmarksBarId: '1',
			folders: [],
			rootBookmarkIds: [],
			externalBookmarkIds: [],
			loading: false,
			permissionState: { hasPermission: true, isRequesting: false }
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('拖拽排序期间不会重新进入全局加载态', async () => {
		const loadingTransitions: boolean[] = [];
		const unsubscribe = useBookmarkStore.subscribe(state => {
			loadingTransitions.push(state.loading);
		});

		await useBookmarkStore.getState().moveBookmarkOptimized('first', 'second');
		unsubscribe();

		expect(chrome.bookmarks.move).toHaveBeenCalledWith('first', {
			parentId: '1',
			index: 2
		});
		expect(loadingTransitions).not.toContain(true);
		expect(useBookmarkStore.getState().rootBookmarkIds).toEqual([
			'second',
			'first'
		]);
	});
});
