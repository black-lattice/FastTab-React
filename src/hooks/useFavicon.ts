import { useState, useEffect, useRef, useCallback } from 'react';

// 缓存配置
const CACHE_KEY = 'favicon_cache_v3';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7天
const MAX_CACHE_SIZE = 1000;

interface CacheEntry {
	data: string; // Base64 或 URL
	timestamp: number;
	expiry: number;
}

// 缓存管理
const cacheManager = {
	async get(key: string): Promise<string | null> {
		try {
			if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
				const result = await chrome.storage.local.get(CACHE_KEY);
				const cache = result[CACHE_KEY] || {};
				const entry = cache[key] as CacheEntry;
				if (entry && Date.now() < entry.expiry) return entry.data;
				return null;
			} else {
				const local = localStorage.getItem(CACHE_KEY);
				if (!local) return null;
				const cache = JSON.parse(local);
				const entry = cache[key];
				if (entry && Date.now() < entry.expiry) return entry.data;
				return null;
			}
		} catch (e) {
			return null;
		}
	},

	async set(key: string, data: string) {
		try {
			if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
				const result = await chrome.storage.local.get(CACHE_KEY);
				const cache = result[CACHE_KEY] || {};
				
				const keys = Object.keys(cache);
				if (keys.length >= MAX_CACHE_SIZE) {
					// 删除最早的
					delete cache[keys[0]];
				}

				cache[key] = {
					data,
					timestamp: Date.now(),
					expiry: Date.now() + CACHE_EXPIRY
				};
				await chrome.storage.local.set({ [CACHE_KEY]: cache });
			} else {
				const local = localStorage.getItem(CACHE_KEY);
				const cache = local ? JSON.parse(local) : {};
				cache[key] = {
					data,
					timestamp: Date.now(),
					expiry: Date.now() + CACHE_EXPIRY
				};
				localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
			}
		} catch (e) {
			console.warn('缓存设置失败:', e);
		}
	}
};

// 验证图片是否有效
const validateImage = (url: string): Promise<boolean> => {
	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => resolve(true);
		img.onerror = () => resolve(false);
		img.src = url;
		// 3秒超时
		setTimeout(() => resolve(false), 3000);
	});
};

// 全局请求队列，避免同一域名多次请求
const pendingRequests = new Map<string, Promise<string | null>>();

// 将 URL 转为 Base64
const fetchAsBase64 = async (url: string): Promise<string> => {
	const response = await fetch(url);
	if (!response.ok) throw new Error('Fetch failed');
	const blob = await response.blob();
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
};

export const useFavicon = (url: string) => {
	const [faviconUrl, setFaviconUrl] = useState<string>('');
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const mountedRef = useRef<boolean>(true);
	const lastUrlRef = useRef<string>('');

	const getHostname = (urlStr: string) => {
		try {
			return new URL(urlStr).hostname;
		} catch (e) {
			return urlStr;
		}
	};

	const fetchIconWaterfall = async (targetUrl: string, hostname: string): Promise<string | null> => {
		// 策略 A: Chrome 内部 API
		try {
			const chromeFaviconUrl = `/_favicon/?pageUrl=${encodeURIComponent(targetUrl)}&size=64`;
			const base64 = await fetchAsBase64(chromeFaviconUrl);
			if (base64.length > 200) {
				await cacheManager.set(hostname, base64);
				return base64;
			}
		} catch (e) {}

		// 策略 B: Google Favicon API
		const googleUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
		if (await validateImage(googleUrl)) {
			await cacheManager.set(hostname, googleUrl);
			return googleUrl;
		}

		// 策略 C: DuckDuckGo API
		const ddgUrl = `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
		if (await validateImage(ddgUrl)) {
			await cacheManager.set(hostname, ddgUrl);
			return ddgUrl;
		}

		// 策略 D: 直接尝试 /favicon.ico
		try {
			const directUrl = `${new URL(targetUrl).origin}/favicon.ico`;
			if (await validateImage(directUrl)) {
				await cacheManager.set(hostname, directUrl);
				return directUrl;
			}
		} catch (e) {}

		return null;
	};

	const loadFavicon = useCallback(async (targetUrl: string) => {
		if (!targetUrl || lastUrlRef.current === targetUrl) return;
		lastUrlRef.current = targetUrl;
		
		const hostname = getHostname(targetUrl);
		
		// 1. 检查缓存
		const cached = await cacheManager.get(hostname);
		if (cached) {
			if (mountedRef.current) setFaviconUrl(cached);
			return;
		}

		// 2. 检查是否有正在进行的请求
		if (pendingRequests.has(hostname)) {
			if (mountedRef.current) setIsLoading(true);
			const result = await pendingRequests.get(hostname);
			if (mountedRef.current) {
				setFaviconUrl(result || '');
				setIsLoading(false);
			}
			return;
		}

		if (mountedRef.current) setIsLoading(true);

		// 3. 瀑布式尝试获取图标，并加入队列
		const fetchPromise = fetchIconWaterfall(targetUrl, hostname);
		pendingRequests.set(hostname, fetchPromise);

		try {
			const result = await fetchPromise;
			if (mountedRef.current) setFaviconUrl(result || '');
		} finally {
			pendingRequests.delete(hostname);
			if (mountedRef.current) setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		mountedRef.current = true;
		if (url) {
			loadFavicon(url);
		}
		return () => {
			mountedRef.current = false;
		};
	}, [url, loadFavicon]);

	return {
		faviconUrl,
		isLoading
	};
};
