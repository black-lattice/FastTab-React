import { create } from 'zustand';
import { Bookmark } from '../types';

interface UIState {
	isEditModalOpen: boolean;
	editingBookmark: Bookmark | null;
	isBookmarkManagerOpen: boolean;
	selectedBookmarkIds: string[];
	openEditModal: (bookmark: Bookmark) => void;
	closeEditModal: () => void;
	openBookmarkManager: () => void;
	closeBookmarkManager: () => void;
	setSelectedBookmarkIds: (ids: string[]) => void;
}

export const useUIStore = create<UIState>(set => ({
	isEditModalOpen: false,
	editingBookmark: null,
	isBookmarkManagerOpen: false,
	selectedBookmarkIds: [],

	openEditModal: (bookmark: Bookmark) =>
		set({ isEditModalOpen: true, editingBookmark: bookmark }),

	closeEditModal: () => set({ isEditModalOpen: false, editingBookmark: null }),

	openBookmarkManager: () => set({ isBookmarkManagerOpen: true }),

	closeBookmarkManager: () =>
		set({ isBookmarkManagerOpen: false, selectedBookmarkIds: [] }),

	setSelectedBookmarkIds: (selectedIds: string[]) =>
		set({ selectedBookmarkIds: selectedIds })
}));
