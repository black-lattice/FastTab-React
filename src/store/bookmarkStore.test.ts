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
			permissions: {
				contains: vi.fn(() => Promise.resolve(true))
			},
			bookmarks: {
				get: vi.fn((id: string) =>
					Promise.resolve([id === first.id ? first : second])
				),
				move: vi.fn(() => Promise.resolve(first)),
				remove: vi.fn(() => Promise.resolve()),
				create: vi.fn(() => Promise.resolve({ ...first, id: 'restored' })),
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
			error: null,
			lastUndoAction: null,
			isUndoing: false,
			permissionState: { hasPermission: true, isChecking: false }
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

	it('可以检查必需的书签权限', async () => {
		useBookmarkStore.setState({
			permissionState: { hasPermission: false, isChecking: false }
		});

		expect(await useBookmarkStore.getState().checkPermission()).toBe(true);
		expect(chrome.permissions.contains).toHaveBeenCalledWith({
			permissions: ['bookmarks']
		});
		expect(useBookmarkStore.getState().permissionState).toEqual({
			hasPermission: true,
			isChecking: false
		});
	});

	it('删除书签后可以按原位置重新创建', async () => {
		useBookmarkStore.setState({ externalBookmarkIds: ['first'] });
		await useBookmarkStore.getState().removeBookmarks(['first']);
		expect(useBookmarkStore.getState().lastUndoAction?.kind).toBe('delete');

		await useBookmarkStore.getState().undoLastAction();

		expect(chrome.bookmarks.create).toHaveBeenCalledWith({
			title: 'first',
			url: 'https://first.test',
			parentId: '1',
			index: 0
		});
		expect(useBookmarkStore.getState().lastUndoAction).toBeNull();
	});

	it('可以撤销最近一次拖拽排序', async () => {
		await useBookmarkStore.getState().moveBookmarkOptimized('first', 'second');
		expect(useBookmarkStore.getState().lastUndoAction?.kind).toBe('move');

		await useBookmarkStore.getState().undoLastAction();

		expect(chrome.bookmarks.move).toHaveBeenLastCalledWith('first', {
			parentId: '1',
			index: 0
		});
		expect(useBookmarkStore.getState().lastUndoAction).toBeNull();
	});
});
