import { create } from 'zustand';
import { Bookmark } from '../types';

interface UIState {
	isEditModalOpen: boolean;
	editingBookmark: Bookmark | null;
	isBookmarkManagerOpen: boolean;
	isAddBookmarkOpen: boolean;
	isAppearanceSettingsOpen: boolean;
	isWorkspaceManagerOpen: boolean;
	selectedBookmarkIds: string[];
	openEditModal: (bookmark: Bookmark) => void;
	closeEditModal: () => void;
	openBookmarkManager: () => void;
	closeBookmarkManager: () => void;
	openAddBookmark: () => void;
	closeAddBookmark: () => void;
	openAppearanceSettings: () => void;
	closeAppearanceSettings: () => void;
	toggleAppearanceSettings: () => void;
	openWorkspaceManager: () => void;
	closeWorkspaceManager: () => void;
	setSelectedBookmarkIds: (ids: string[]) => void;
}

export const useUIStore = create<UIState>(set => ({
	isEditModalOpen: false,
	editingBookmark: null,
	isBookmarkManagerOpen: false,
	isAddBookmarkOpen: false,
	isAppearanceSettingsOpen: false,
	isWorkspaceManagerOpen: false,
	selectedBookmarkIds: [],

	openEditModal: (bookmark: Bookmark) =>
		set({ isEditModalOpen: true, editingBookmark: bookmark }),

	closeEditModal: () => set({ isEditModalOpen: false, editingBookmark: null }),

	openBookmarkManager: () => set({ isBookmarkManagerOpen: true }),

	closeBookmarkManager: () =>
		set({ isBookmarkManagerOpen: false, selectedBookmarkIds: [] }),

	openAddBookmark: () => set({ isAddBookmarkOpen: true }),

	closeAddBookmark: () => set({ isAddBookmarkOpen: false }),

	openAppearanceSettings: () => set({ isAppearanceSettingsOpen: true }),

	closeAppearanceSettings: () => set({ isAppearanceSettingsOpen: false }),

	toggleAppearanceSettings: () =>
		set(state => ({ isAppearanceSettingsOpen: !state.isAppearanceSettingsOpen })),

	openWorkspaceManager: () => set({ isWorkspaceManagerOpen: true }),

	closeWorkspaceManager: () => set({ isWorkspaceManagerOpen: false }),

	setSelectedBookmarkIds: (selectedIds: string[]) =>
		set({ selectedBookmarkIds: selectedIds })
}));
