import { create } from 'zustand';
import { Bookmark } from '../types';

interface UIState {
  // 编辑书签模态框
  editModal: {
    isOpen: boolean;
    bookmark: Bookmark | null;
  };
  openEditModal: (bookmark: Bookmark) => void;
  closeEditModal: () => void;

  // 书签管理面板
  bookmarkManager: {
    isOpen: boolean;
    selectedIds: string[];
  };
  openBookmarkManager: () => void;
  closeBookmarkManager: () => void;
  setSelectedBookmarkIds: (ids: string[]) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  editModal: {
    isOpen: false,
    bookmark: null,
  },
  openEditModal: (bookmark) => set({ editModal: { isOpen: true, bookmark } }),
  closeEditModal: () => set({ editModal: { isOpen: false, bookmark: null } }),

  bookmarkManager: {
    isOpen: false,
    selectedIds: [],
  },
  openBookmarkManager: () => set((state) => ({ bookmarkManager: { ...state.bookmarkManager, isOpen: true } })),
  closeBookmarkManager: () => set((state) => ({ bookmarkManager: { ...state.bookmarkManager, isOpen: false } })),
  setSelectedBookmarkIds: (selectedIds) => set((state) => ({ bookmarkManager: { ...state.bookmarkManager, selectedIds } })),
}));
