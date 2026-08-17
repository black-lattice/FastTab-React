import { describe, expect, it } from 'vitest';
import type { Bookmark } from '../types';
import { rankBookmarks } from './bookmarkSearch';

const bookmarks: Bookmark[] = [
	{ id: 'docs', title: '项目文档', url: 'https://docs.example.com' },
	{ id: 'design', title: '设计系统', url: 'https://design.example.com' },
	{ id: 'github', title: 'GitHub', url: 'https://github.com' }
];

describe('书签搜索排序', () => {
	it('支持拼音全拼和首字母匹配', () => {
		const phoneticIndex = {
			docs: { pinyin: 'xiangmuwendang', initials: 'xmwd' },
			design: { pinyin: 'shejixitong', initials: 'sjxt' }
		};
		expect(rankBookmarks(bookmarks, 'xiangmuwendang', {}, phoneticIndex)[0].id).toBe('docs');
		expect(rankBookmarks(bookmarks, 'sjxt', {}, phoneticIndex)[0].id).toBe('design');
	});

	it('支持不连续字符的模糊匹配', () => {
		expect(rankBookmarks(bookmarks, 'gthb', {})[0].id).toBe('github');
	});

	it('同等匹配时优先常用书签', () => {
		const similar = [
			{ id: 'a', title: '文档 A', url: 'https://a.test' },
			{ id: 'b', title: '文档 B', url: 'https://b.test' }
		];
		expect(rankBookmarks(similar, '文档', {
			b: { count: 20, lastUsed: Date.now() }
		})[0].id).toBe('b');
	});
});
