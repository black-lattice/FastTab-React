export interface Bookmark {
  id: string;
  title: string;
  url: string;
  parentId?: string;
  dateAdded?: number;
  dateGroupModified?: number;
  index?: number;
  children?: Bookmark[];
}

export interface SearchEngine {
  value: string;
  label: string;
  icon: string;
  searchUrl: string;
}

export interface BookmarkFolder {
  id: string;
  title: string;
  children: Bookmark[];
}

export interface EditModalState {
  isOpen: boolean;
  bookmark: Bookmark | null;
}

export interface PermissionState {
  hasPermission: boolean;
  isRequesting: boolean;
}
