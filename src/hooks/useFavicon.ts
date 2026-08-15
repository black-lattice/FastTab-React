import { useCallback, useEffect, useState } from 'react';

const createFaviconUrl = (pageUrl: string): string =>
	`/_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=128`;

export const useFavicon = (url: string) => {
	const [faviconUrl, setFaviconUrl] = useState('');

	useEffect(() => {
		setFaviconUrl(url ? createFaviconUrl(url) : '');
	}, [url]);

	const handleFaviconError = useCallback(() => {
		setFaviconUrl('');
	}, []);

	return {
		faviconUrl,
		isLoading: false,
		handleFaviconError
	};
};
