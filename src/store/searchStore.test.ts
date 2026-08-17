import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	DEFAULT_ENGINES,
	normalizeSearchEngineUrl,
	useSearchStore
} from './searchStore';

describe('searchStore', () => {
	beforeEach(() => {
		vi.stubGlobal('window', { location: { href: '' } });
		vi.stubGlobal('chrome', {
			storage: {
				sync: { set: vi.fn(() => Promise.resolve()) },
				local: { set: vi.fn(() => Promise.resolve()) }
			},
			tabs: { create: vi.fn(() => Promise.resolve()) }
		});
		useSearchStore.setState({
			searchQuery: '',
			selectedEngine: DEFAULT_ENGINES[2],
			searchEngines: DEFAULT_ENGINES,
			customEngines: [],
			openBehavior: 'current',
			bookmarkUsage: {}
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('兼容 %s 并拒绝没有查询占位符的地址', () => {
		expect(normalizeSearchEngineUrl('https://example.com?q=%s')).toBe(
			'https://example.com?q={query}'
		);
		expect(() => normalizeSearchEngineUrl('https://example.com/search'))
			.toThrow('搜索地址需要包含 {query} 占位符');
	});

	it('添加自定义引擎后自动选中并持久化', async () => {
		await useSearchStore.getState().addCustomEngine(
			'站内搜索',
			'https://example.com?q={query}'
		);

		expect(useSearchStore.getState().selectedEngine.label).toBe('站内搜索');
		expect(useSearchStore.getState().customEngines).toHaveLength(1);
		expect(chrome.storage.sync.set).toHaveBeenCalledOnce();
	});

	it('支持在后台标签页执行网页搜索', () => {
		useSearchStore.setState({ openBehavior: 'background' });
		useSearchStore.getState().performSearch('测试 搜索');

		expect(chrome.tabs.create).toHaveBeenCalledWith({
			url: 'https://www.baidu.com/s?wd=%E6%B5%8B%E8%AF%95%20%E6%90%9C%E7%B4%A2',
			active: false
		});
	});
});
