import { useState, useEffect, useRef, useCallback } from 'react';

// 缓存配置
const CACHE_KEY = 'favicon_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时
const MAX_CACHE_SIZE = 500; // 最多缓存500个图标

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

// 缓存数据结构
interface CacheEntry {
	faviconUrl: string;
	timestamp: number;
	expiry: number;
}

// 缓存管理函数
const cacheManager = {
	// 读取缓存
	getCache: (hostname: string): string | null => {
		try {
			const cached = localStorage.getItem(CACHE_KEY);
			if (!cached) return null;

			const cacheData: Record<string, CacheEntry> = JSON.parse(cached);
			const entry = cacheData[hostname];

			if (!entry) return null;

			// 检查是否过期
			if (Date.now() > entry.expiry) {
				// 过期了，删除缓存
				delete cacheData[hostname];
				localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
				return null;
			}

			return entry.faviconUrl;
		} catch (error) {
			console.warn('读取缓存失败:', error);
			return null;
		}
	},

	// 设置缓存
	setCache: (hostname: string, faviconUrl: string): void => {
		try {
			const cached = localStorage.getItem(CACHE_KEY);
			const cacheData: Record<string, CacheEntry> = cached
				? JSON.parse(cached)
				: {};

			// 检查缓存大小，如果超过限制则清理最旧的缓存
			const cacheKeys = Object.keys(cacheData);
			if (cacheKeys.length >= MAX_CACHE_SIZE) {
				// 找到最旧的缓存条目
				let oldestKey = cacheKeys[0];
				let oldestTime = cacheData[oldestKey].timestamp;

				for (const key of cacheKeys) {
					if (cacheData[key].timestamp < oldestTime) {
						oldestKey = key;
						oldestTime = cacheData[key].timestamp;
					}
				}

				// 删除最旧的缓存
				delete cacheData[oldestKey];
			}

			// 设置新缓存
			cacheData[hostname] = {
				faviconUrl,
				timestamp: Date.now(),
				expiry: Date.now() + CACHE_EXPIRY
			};

			localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
		} catch (error) {
			console.warn('设置缓存失败:', error);
		}
	},

	// 清理过期缓存
	cleanExpiredCache: (): void => {
		try {
			const cached = localStorage.getItem(CACHE_KEY);
			if (!cached) return;

			const cacheData: Record<string, CacheEntry> = JSON.parse(cached);
			const now = Date.now();
			let hasChanges = false;

			for (const [hostname, entry] of Object.entries(cacheData)) {
				if (now > entry.expiry) {
					delete cacheData[hostname];
					hasChanges = true;
				}
			}

			if (hasChanges) {
				localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
			}
		} catch (error) {
			console.warn('清理缓存失败:', error);
		}
	}
};

// 页面加载时清理过期缓存
if (typeof window !== 'undefined') {
	cacheManager.cleanExpiredCache();
}

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
			// 首先检查缓存
			const cachedUrl = cacheManager.getCache(hostname);
			if (cachedUrl) {
				console.log(`使用缓存的图标: ${hostname}`);
				return cachedUrl;
			}

			// 缓存中没有，依次尝试所有图标服务
			for (const service of FAVICON_SERVICES) {
				try {
					const iconUrl = await tryService(service, url, hostname);
					if (iconUrl) {
						// 获取成功，设置缓存
						cacheManager.setCache(hostname, iconUrl);
						console.log(
							`获取图标成功并缓存: ${hostname} - ${service.name}`
						);
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
			console.log(`所有图标服务都失败: ${hostname}`);
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
