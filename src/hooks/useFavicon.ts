import { useState, useEffect, useRef, useCallback } from 'react';

// 图标服务配置 - 按优先级排序
const FAVICON_SERVICES = [
	{
		name: 'duckduckgo',
		url: (hostname: string) =>
			`https://icons.duckduckgo.com/ip3/${hostname}.ico`,
		timeout: 3000
	},
	{
		name: 'google',
		url: (hostname: string) =>
			`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
		timeout: 3000
	},
	{
		name: 'chrome',
		url: (url: string) => `chrome://favicon/${url}`,
		timeout: 1000
	}
];

export const useFavicon = (url: string) => {
	const [faviconUrl, setFaviconUrl] = useState<string>('');
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const mountedRef = useRef<boolean>(true);
	const timeoutRef = useRef<number>(0);

	// 清理函数
	const cleanup = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = 0;
		}
	}, []);

	// 检查是否为有效的URL
	const isValidUrl = useCallback((url: string): boolean => {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}, []);

	// 尝试从单个服务获取图标
	const tryService = useCallback(
		(
			service: (typeof FAVICON_SERVICES)[0],
			url: string,
			hostname?: string
		): Promise<string | null> => {
			return new Promise(resolve => {
				const img = new Image();
				let timeoutId: number;

				const cleanup = () => {
					img.onload = null;
					img.onerror = null;
					if (timeoutId) clearTimeout(timeoutId);
				};

				img.onload = () => {
					cleanup();
					// 图片加载成功，返回该服务的图标URL
					resolve(service.url(hostname || url));
				};

				img.onerror = () => {
					cleanup();
					resolve(null); // 加载失败，尝试下一个服务
				};

				// 设置超时
				timeoutId = window.setTimeout(() => {
					cleanup();
					resolve(null); // 超时，尝试下一个服务
				}, service.timeout);

				// 加载图片（img标签天然支持跨域）
				img.src = service.url(hostname || url);
			});
		},
		[]
	);

	// 依次尝试所有服务获取图标
	const fetchFavicon = useCallback(
		async (url: string, hostname: string): Promise<string | null> => {
			// 依次尝试所有图标服务
			for (const service of FAVICON_SERVICES) {
				try {
					const iconUrl = await tryService(service, url, hostname);
					if (iconUrl) {
						return iconUrl;
					}
				} catch (serviceError) {
					console.warn(
						`图标服务 ${service.name} 失败:`,
						serviceError
					);
					continue;
				}
			}

			// 所有服务都失败，返回null让组件显示默认字母
			return null;
		},
		[tryService]
	);

	// 主函数
	const loadFavicon = useCallback(() => {
		if (!mountedRef.current) return;

		if (!isValidUrl(url)) {
			setFaviconUrl('');
			setIsLoading(false);
			return;
		}

		const loadFaviconAsync = async () => {
			try {
				const hostname = new URL(url).hostname;
				setIsLoading(true);

				const result = await fetchFavicon(url, hostname);

				if (mountedRef.current) {
					setFaviconUrl(result || '');
				}
			} catch (err) {
				if (mountedRef.current) {
					console.error('获取图标失败:', err);
					setFaviconUrl('');
				}
			} finally {
				if (mountedRef.current) {
					setIsLoading(false);
				}
			}
		};

		// 延迟执行，避免频繁调用
		timeoutRef.current = window.setTimeout(loadFaviconAsync, 100);
	}, [url, isValidUrl, fetchFavicon]);

	// 组件卸载时清理
	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			cleanup();
		};
	}, [cleanup]);

	// URL变化时重新加载
	useEffect(() => {
		if (url) {
			loadFavicon();
		}
	}, [url, loadFavicon]);

	return {
		faviconUrl,
		isLoading
	};
};
