import { describe, expect, it } from 'vitest';
import type { Bookmark } from '../types';
import { filterWorkspaceBookmarks, updateWorkspaceSelection } from './workspaceSelection';

const bookmarks: Bookmark[] = [
	{ id: 'root-link', parentId: '1', title: '首页', url: 'https://home.test' },
	{ id: 'dev-link', parentId: 'dev', title: '开发工具', url: 'https://dev.test' },
	{ id: 'nested-link', parentId: 'nested', title: '嵌套工具', url: 'https://nested.test' },
	{ id: 'other-link', parentId: 'other', title: '其他工具', url: 'https://other.test' }
];
const filter = (category: string, query = '') =>
	filterWorkspaceBookmarks(bookmarks, category, ['root-link'], ['nested-link'], query).map(item => item.id);

describe('工作区按文件夹选择书签', () => {
	it('只展示当前文件夹的直属书签，子文件夹独立分类', () => {
		expect(filter('dev')).toEqual(['dev-link']);
		expect(filter('nested')).toEqual(['nested-link']);
		expect(filter('empty')).toEqual([]);
	});

	it('书签栏和已选分类只展示各自的书签', () => {
		expect(filter('root')).toEqual(['root-link']);
		expect(filter('selected')).toEqual(['nested-link']);
		expect(filter('all')).toHaveLength(4);
	});

	it('搜索限制在当前分类，支持标题和网址且忽略大小写', () => {
		expect(filter('dev', '工具')).toEqual(['dev-link']);
		expect(filter('dev', ' NESTED.TEST ')).toEqual([]);
		expect(filter('all', ' NESTED.TEST ')).toEqual(['nested-link']);
	});

	it('分类全选去重并保留其他分类的已选内容', () => {
		expect(updateWorkspaceSelection(['other-link', 'dev-link'], ['dev-link'], true))
			.toEqual(['other-link', 'dev-link']);
		expect(updateWorkspaceSelection(['other-link'], ['dev-link'], true))
			.toEqual(['other-link', 'dev-link']);
	});

	it('取消搜索结果的全选不会清空其他分类或被筛掉的选项', () => {
		expect(updateWorkspaceSelection(['other-link', 'dev-link', 'nested-link'], ['dev-link'], false))
			.toEqual(['other-link', 'nested-link']);
		expect(updateWorkspaceSelection(['other-link'], [], false)).toEqual(['other-link']);
	});
});
