import { describe, expect, it } from 'vitest';
import type { Bookmark } from '../types';
import { getWorkspaceContent } from './workspaceContent';

const bookmarks: Bookmark[] = [
	{ id: 'root', title: '根书签', url: 'https://root.test' },
	{ id: 'nested', title: '嵌套书签', url: 'https://nested.test' }
];
const folders: Bookmark[] = [{ id: 'folder', title: '文件夹', url: '',
	children: [{ id: 'nested-folder', title: '嵌套文件夹', url: '', children: [] }] }];

describe('工作区内容', () => {
	it.each(['home', 'dev'])('%s 仅展示自己关联的书签和文件夹，根书签也可移除', id => {
		const result = getWorkspaceContent(bookmarks, folders, {
			id, name: id, bookmarkIds: ['nested', 'deleted'], folderIds: ['nested-folder']
		});
		expect(result.bookmarks.map(item => item.id)).toEqual(['nested']);
		expect(result.folders.map(item => item.id)).toEqual(['nested-folder']);
	});
	it('没有工作区时返回空内容，不会回退到旧的首页规则', () => {
		expect(getWorkspaceContent(bookmarks, folders)).toEqual({ bookmarks: [], folders: [] });
	});
	it('空工作区不会自动带入其他工作区内容', () => {
		expect(getWorkspaceContent(bookmarks, folders, {
			id: 'home', name: '首页', bookmarkIds: [], folderIds: []
		})).toEqual({ bookmarks: [], folders: [] });
	});
});
