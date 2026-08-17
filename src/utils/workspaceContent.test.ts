import { describe, expect, it } from 'vitest';
import type { Bookmark } from '../types';
import { getWorkspaceContent } from './workspaceContent';

const bookmarks: Bookmark[] = [
	{ id: 'root-bookmark', title: '根书签', url: 'https://root.test' },
	{ id: 'nested-bookmark', title: '嵌套书签', url: 'https://nested.test' }
];
const folders: Bookmark[] = [{
	id: 'folder',
	title: '文件夹',
	url: '',
	children: [{
		id: 'nested-folder',
		title: '嵌套文件夹',
		url: '',
		children: []
	}]
}];

describe('工作区内容', () => {
	it('首页继续显示根书签、外显书签和根文件夹', () => {
		const result = getWorkspaceContent(
			bookmarks,
			folders,
			['root-bookmark'],
			['nested-bookmark'],
			[]
		);
		expect(result.bookmarks.map(item => item.id)).toEqual([
			'root-bookmark',
			'nested-bookmark'
		]);
		expect(result.folders.map(item => item.id)).toEqual(['folder']);
	});

	it('首页可以隐藏指定的一级文件夹', () => {
		const result = getWorkspaceContent(
			bookmarks,
			folders,
			['root-bookmark'],
			[],
			['folder']
		);
		expect(result.folders).toEqual([]);
	});

	it('自定义工作区可以引用任意层级的项目', () => {
		const result = getWorkspaceContent(
			bookmarks,
			folders,
			[],
			[],
			['nested-folder'],
			{
				id: 'work',
				name: '工作',
				bookmarkIds: ['nested-bookmark'],
				folderIds: ['nested-folder']
			}
		);
		expect(result.bookmarks.map(item => item.id)).toEqual(['nested-bookmark']);
		expect(result.folders.map(item => item.id)).toEqual(['nested-folder']);
	});
});
