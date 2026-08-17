export const MAX_BACKGROUND_FILE_SIZE = 12 * 1024 * 1024;

export const validateBackgroundImage = (blob: Blob) => {
	if (!blob.type.startsWith('image/')) {
		throw new Error('该文件不是有效的图片');
	}
	if (blob.size > MAX_BACKGROUND_FILE_SIZE) {
		throw new Error('背景图片不能超过 12MB');
	}
};

export const downloadBackgroundImage = async (url: string): Promise<Blob> => {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`图片下载失败（${response.status}）`);
	}

	const contentType = response.headers.get('content-type') || '';
	if (!contentType.startsWith('image/')) {
		throw new Error('该地址返回的内容不是图片');
	}
	const contentLength = Number(response.headers.get('content-length'));
	if (Number.isFinite(contentLength) && contentLength > MAX_BACKGROUND_FILE_SIZE) {
		throw new Error('背景图片不能超过 12MB');
	}

	if (!response.body) {
		const blob = await response.blob();
		validateBackgroundImage(blob);
		return blob;
	}

	const reader = response.body.getReader();
	const chunks: ArrayBuffer[] = [];
	let totalSize = 0;
	let reading = true;
	while (reading) {
		const { done, value } = await reader.read();
		if (done) {
			reading = false;
			continue;
		}
		totalSize += value.byteLength;
		if (totalSize > MAX_BACKGROUND_FILE_SIZE) {
			await reader.cancel();
			throw new Error('背景图片不能超过 12MB');
		}
		const chunk = new Uint8Array(value.byteLength);
		chunk.set(value);
		chunks.push(chunk.buffer);
	}

	const blob = new Blob(chunks, { type: contentType });
	validateBackgroundImage(blob);
	return blob;
};
