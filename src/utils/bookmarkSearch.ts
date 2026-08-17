import type { Bookmark } from '../types';

export interface BookmarkUsage {
	count: number;
	lastUsed: number;
}

export interface BookmarkPhonetic {
	pinyin: string;
	initials: string;
}

const normalize = (value: string) => value.trim().toLowerCase();
const searchFormCache = new WeakMap<Bookmark, { title: string; url: string }>();

const isSubsequence = (query: string, value: string) => {
	let queryIndex = 0;
	for (const character of value) {
		if (character === query[queryIndex]) queryIndex += 1;
		if (queryIndex === query.length) return true;
	}
	return false;
};

const createSearchForms = (bookmark: Bookmark) => {
	return {
		title: normalize(bookmark.title),
		url: normalize(bookmark.url)
	};
};

const getSearchForms = (bookmark: Bookmark) => {
	const cached = searchFormCache.get(bookmark);
	if (cached) return cached;
	const forms = createSearchForms(bookmark);
	searchFormCache.set(bookmark, forms);
	return forms;
};

const getMatchScore = (
	query: string,
	bookmark: Bookmark,
	phonetic?: BookmarkPhonetic
) => {
	const forms = getSearchForms(bookmark);
	if (forms.title === query) return 0;
	if (forms.title.startsWith(query)) return 10;
	if (phonetic?.initials.startsWith(query)) return 14;
	if (phonetic?.pinyin.startsWith(query)) return 18;
	if (forms.title.includes(query)) return 24;
	if (phonetic?.initials.includes(query)) return 28;
	if (phonetic?.pinyin.includes(query)) return 32;
	if (forms.url.includes(query)) return 40;
	if (isSubsequence(query, forms.title)) return 52;
	if (phonetic && isSubsequence(query, phonetic.pinyin)) return 58;
	return Number.POSITIVE_INFINITY;
};

export const rankBookmarks = (
	bookmarks: Bookmark[],
	query: string,
	usage: Record<string, BookmarkUsage>,
	phoneticIndex: Record<string, BookmarkPhonetic> = {},
	limit = 8
) => {
	const normalizedQuery = normalize(query);
	if (!normalizedQuery) return [];

	return bookmarks
		.map(bookmark => {
			const matchScore = getMatchScore(
				normalizedQuery,
				bookmark,
				phoneticIndex[bookmark.id]
			);
			const bookmarkUsage = usage[bookmark.id];
			const frequencyBoost = Math.min(bookmarkUsage?.count || 0, 20) * 0.3;
			const recentBoost = bookmarkUsage?.lastUsed
				? Math.max(0, 5 - (Date.now() - bookmarkUsage.lastUsed) / 86_400_000)
				: 0;
			return {
				bookmark,
				score: matchScore - frequencyBoost - recentBoost
			};
		})
		.filter(result => Number.isFinite(result.score))
		.sort((a, b) => a.score - b.score || a.bookmark.title.localeCompare(b.bookmark.title, 'zh-CN'))
		.slice(0, limit)
		.map(result => result.bookmark);
};
