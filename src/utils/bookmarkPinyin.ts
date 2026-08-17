import { pinyin } from 'pinyin-pro';
import type { Bookmark } from '../types';
import type { BookmarkPhonetic } from './bookmarkSearch';

export const buildBookmarkPhoneticIndex = (bookmarks: Bookmark[]) =>
	bookmarks.reduce<Record<string, BookmarkPhonetic>>((index, bookmark) => {
		const syllables = pinyin(bookmark.title, {
			toneType: 'none',
			type: 'array'
		}).map(value => value.trim().toLowerCase());
		index[bookmark.id] = {
			pinyin: syllables.join(''),
			initials: syllables.map(value => value.charAt(0)).join('')
		};
		return index;
	}, {});
