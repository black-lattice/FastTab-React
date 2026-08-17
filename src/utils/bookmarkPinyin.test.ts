import { describe, expect, it } from 'vitest';
import { buildBookmarkPhoneticIndex } from './bookmarkPinyin';

describe('书签拼音索引', () => {
	it('生成全拼和拼音首字母', () => {
		const index = buildBookmarkPhoneticIndex([
			{ id: 'design', title: '设计系统', url: 'https://design.test' }
		]);
		expect(index.design).toEqual({
			pinyin: 'shejixitong',
			initials: 'sjxt'
		});
	});
});
