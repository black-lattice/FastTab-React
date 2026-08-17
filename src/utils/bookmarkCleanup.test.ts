import { describe, expect, it } from 'vitest';
import type { Bookmark } from '../types';
import {
	findDuplicateBookmarkGroups,
	findEmptyFolders
} from './bookmarkCleanup';

describe('书签整理分析', () => {
	it('忽略链接 hash 并保留最早添加的重复项', () => {
		const bookmarks: Bookmark[] = [
			{ id: 'new', title: '新', url: 'https://example.com/#docs', dateAdded: 20 },
			{ id: 'old', title: '旧', url: 'https://example.com', dateAdded: 10 }
		];
		const groups = findDuplicateBookmarkGroups(bookmarks);

		expect(groups).toHaveLength(1);
		expect(groups[0].map(item => item.id)).toEqual(['old', 'new']);
	});

	it('识别所有层级中的空文件夹', () => {
		const folders: Bookmark[] = [{
			id: 'root',
			title: '根',
			url: '',
			children: [{ id: 'empty', title: '空', url: '', children: [] }]
		}];
		expect(findEmptyFolders(folders).map(folder => folder.id)).toEqual(['empty']);
	});
});
