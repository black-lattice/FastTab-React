import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	DEFAULT_LAYOUT_SETTINGS,
	getLayoutMetrics,
	normalizeLayoutSettings,
	useLayoutStore
} from './layoutStore';

describe('layoutStore', () => {
	const setProperty = vi.fn();

	beforeEach(() => {
		vi.stubGlobal('document', {
			documentElement: {
				dataset: {},
				style: { setProperty }
			}
		});
		vi.stubGlobal('chrome', {
			storage: {
				sync: {
					get: vi.fn(() => Promise.resolve({})),
					set: vi.fn(() => Promise.resolve()),
					remove: vi.fn(() => Promise.resolve())
				}
			}
		});
		useLayoutStore.setState({
			settings: DEFAULT_LAYOUT_SETTINGS,
			isLoaded: false
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('过滤损坏或越界的持久化配置', () => {
		expect(normalizeLayoutSettings({
			iconSize: 99,
			density: 'unknown',
			titleLines: 8,
			maxColumns: 30,
			folderPosition: 'unknown'
		})).toEqual(DEFAULT_LAYOUT_SETTINGS);
	});

	it('根据尺寸和密度生成稳定的网格参数', () => {
		expect(getLayoutMetrics({
			iconSize: 72,
			density: 'comfortable',
			titleLines: 1,
			maxColumns: 8,
			folderPosition: 'folders-first'
		})).toEqual({
			cellSize: 92,
			frameSize: 76,
			gridGap: 24,
			titleGap: 12,
			titleHeight: 17
		});
	});

	it('保存设置后同步更新状态和 CSS 变量', async () => {
		const settings = {
			...DEFAULT_LAYOUT_SETTINGS,
			iconSize: 72 as const,
			maxColumns: 8
		};

		await useLayoutStore.getState().saveSettings(settings);

		expect(chrome.storage.sync.set).toHaveBeenCalledWith({
			'fasttab-layout-settings': settings
		});
		expect(useLayoutStore.getState().settings).toEqual(settings);
		expect(setProperty).toHaveBeenCalledWith('--bookmark-icon-size', '72px');
	});
});
