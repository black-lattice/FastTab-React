import { describe, expect, it } from 'vitest';
import {
	MAX_BACKGROUND_FILE_SIZE,
	validateBackgroundImage
} from './backgroundImage';

describe('背景图片校验', () => {
	it('拒绝非图片内容', () => {
		expect(() => validateBackgroundImage(new Blob(['text'], { type: 'text/plain' })))
			.toThrow('该文件不是有效的图片');
	});

	it('拒绝超过 12MB 的图片', () => {
		const image = new Blob(
			[new Uint8Array(MAX_BACKGROUND_FILE_SIZE + 1)],
			{ type: 'image/png' }
		);
		expect(() => validateBackgroundImage(image)).toThrow('背景图片不能超过 12MB');
	});

	it('接受限制以内的图片', () => {
		expect(() => validateBackgroundImage(
			new Blob([new Uint8Array(1024)], { type: 'image/png' })
		)).not.toThrow();
	});
});
