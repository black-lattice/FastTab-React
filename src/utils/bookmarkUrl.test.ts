import { describe, expect, it } from 'vitest';
import { normalizeBookmarkUrl } from './bookmarkUrl';

describe('normalizeBookmarkUrl', () => {
	it('为没有协议的网址补充 https', () => {
		expect(normalizeBookmarkUrl('example.com/docs')).toBe(
			'https://example.com/docs'
		);
	});

	it('保留有效的 http 和 https 地址', () => {
		expect(normalizeBookmarkUrl('http://localhost:3000')).toBe(
			'http://localhost:3000/'
		);
	});

	it('拒绝可能执行脚本的协议', () => {
		expect(() => normalizeBookmarkUrl('javascript:alert(1)')).toThrow(
			'仅支持 HTTP 或 HTTPS 网址'
		);
	});
});
