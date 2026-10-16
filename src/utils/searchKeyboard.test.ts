import { describe, expect, it } from 'vitest';
import { getNextSearchIndex, isSearchComposing } from './searchKeyboard';

describe('中文输入法搜索保护', () => {
	it('组词期间将按键交给输入法处理', () => {
		expect(isSearchComposing({ isComposing: false, keyCode: 13 }, true)).toBe(true);
	});

	it('原生事件仍在组词时不触发搜索', () => {
		expect(isSearchComposing({ isComposing: true, keyCode: 13 }, false)).toBe(true);
	});

	it('兼容组词结束标记已清除但确认键仍属于输入法的情况', () => {
		expect(isSearchComposing({ isComposing: false, keyCode: 229 }, false)).toBe(true);
	});

	it('输入完成后再次按普通 Enter 可以执行搜索', () => {
		expect(isSearchComposing({ isComposing: false, keyCode: 13 }, false)).toBe(false);
	});
});

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
