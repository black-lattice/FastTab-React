import { useCallback, useState } from 'react';

const createFaviconUrl = (pageUrl: string): string =>
	`/_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=128`;

const loadedFaviconUrls = new Set<string>();
const failedFaviconUrls = new Set<string>();

export const useFavicon = (url: string) => {
	const faviconUrl = url ? createFaviconUrl(url) : '';
	const [loadedUrl, setLoadedUrl] = useState('');
	const [failedUrl, setFailedUrl] = useState('');
	const isLoaded = Boolean(faviconUrl) && (
		loadedUrl === faviconUrl || loadedFaviconUrls.has(faviconUrl)
	);
	const hasFailed = Boolean(faviconUrl) && (
		failedUrl === faviconUrl || failedFaviconUrls.has(faviconUrl)
	);

	const handleFaviconError = useCallback(() => {
		if (!faviconUrl) return;
		failedFaviconUrls.add(faviconUrl);
		setFailedUrl(faviconUrl);
	}, [faviconUrl]);

	const handleFaviconLoad = useCallback(() => {
		if (!faviconUrl) return;
		loadedFaviconUrls.add(faviconUrl);
		failedFaviconUrls.delete(faviconUrl);
		setLoadedUrl(faviconUrl);
	}, [faviconUrl]);

	return {
		faviconUrl: hasFailed ? '' : faviconUrl,
		isLoaded,
		handleFaviconLoad,
		handleFaviconError
	};
};
