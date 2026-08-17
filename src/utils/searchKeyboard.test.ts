import { describe, expect, it } from 'vitest';
import { getNextSearchIndex } from './searchKeyboard';

describe('搜索键盘导航', () => {
	it('向下和向上移动时会循环选择', () => {
		expect(getNextSearchIndex(-1, 3, 'next')).toBe(0);
		expect(getNextSearchIndex(2, 3, 'next')).toBe(0);
		expect(getNextSearchIndex(0, 3, 'previous')).toBe(2);
	});

	it('没有结果时保持未选择状态', () => {
		expect(getNextSearchIndex(0, 0, 'next')).toBe(-1);
	});
});
