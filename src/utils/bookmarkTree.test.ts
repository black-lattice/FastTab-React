import { describe, expect, it } from 'vitest';
import {
	collectBookmarks,
	findBookmarkFolderPath,
	parseBookmarksBar
} from './bookmarkTree';

const node = (
	id: string,
	title: string,
	options: Partial<chrome.bookmarks.BookmarkTreeNode> = {}
): chrome.bookmarks.BookmarkTreeNode => ({ id, title, ...options });

describe('parseBookmarksBar', () => {
	it('同时保留书签栏根目录书签和嵌套文件夹书签', () => {
		const tree = [
			node('0', 'root', {
				children: [
					node('1', 'Bookmarks bar', {
						children: [
							node('a', 'Root bookmark', { url: 'https://a.test' }),
							node('folder', 'Work', {
								children: [
									node('b', 'Nested bookmark', { url: 'https://b.test' }),
									node('nested-folder', 'Deep', {
										children: [
											node('c', 'Deep bookmark', { url: 'https://c.test' })
										]
									})
								]
							})
						]
					})
				]
			})
		];

		const result = parseBookmarksBar(tree);

		expect(result.bookmarksBarId).toBe('1');
		expect(result.rootBookmarkIds).toEqual(['a']);
		expect(result.folders.map(folder => folder.id)).toEqual(['folder']);
		expect(result.bookmarks.map(bookmark => bookmark.id)).toEqual(['a', 'b', 'c']);
	});

	it('空树返回可安全渲染的空结果', () => {
		expect(parseBookmarksBar([])).toEqual({
			bookmarks: [],
			bookmarksBarId: '',
			folders: [],
			rootBookmarkIds: []
		});
	});

	it('可以定位嵌套文件夹路径并收集可见书签', () => {
		const root = {
			id: 'root',
			title: '根目录',
			url: '',
			children: [
				{ id: 'a', title: 'A', url: 'https://a.test' },
				{
					id: 'nested',
					title: '子目录',
					url: '',
					children: [{ id: 'b', title: 'B', url: 'https://b.test' }]
				}
			]
		};

		expect(findBookmarkFolderPath(root, 'nested')?.map(folder => folder.id))
			.toEqual(['root', 'nested']);
		expect(collectBookmarks(root.children, new Set(['a'])).map(item => item.id))
			.toEqual(['b']);
	});
});
