export const normalizeBookmarkUrl = (value: string): string => {
	const trimmedValue = value.trim();
	if (!trimmedValue) {
		throw new Error('请输入网址');
	}

	const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmedValue)
		? trimmedValue
		: `https://${trimmedValue}`;
	const parsedUrl = new URL(candidate);

	if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
		throw new Error('仅支持 HTTP 或 HTTPS 网址');
	}

	return parsedUrl.toString();
};
