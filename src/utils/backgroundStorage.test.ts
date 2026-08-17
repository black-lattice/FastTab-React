import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	clearBackgroundImage,
	loadBackgroundImage,
	saveBackgroundImage
} from './backgroundStorage';

const resetDatabase = () => new Promise<void>((resolve, reject) => {
	const request = indexedDB.deleteDatabase('fasttab-backgrounds');
	request.onsuccess = () => resolve();
	request.onerror = () => reject(request.error);
});

describe('背景图片本地持久化', () => {
	beforeEach(resetDatabase);

	it('可以保存、读取并清除图片 Blob', async () => {
		const image = new Blob(['image-content'], { type: 'image/png' });
		await saveBackgroundImage(image);

		const stored = await loadBackgroundImage();
		expect(stored?.type).toBe('image/png');
		expect(await stored?.text()).toBe('image-content');

		await clearBackgroundImage();
		expect(await loadBackgroundImage()).toBeNull();
	});
});
