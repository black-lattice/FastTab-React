import React, { useState } from 'react';
import { Bookmark } from '../../types';
import { BookmarkFolder } from '../Bookmark/BookmarkFolder';
import { EditModal } from '../UI/EditModal';
import './BookmarksContainer.css';

interface PermissionState {
	hasPermission: boolean;
	isRequesting: boolean;
}

interface BookmarksContainerProps {
	bookmarks: Bookmark[];
	folders: Bookmark[];
	loading: boolean;
	permissionState: PermissionState;
	onRequestPermission: () => Promise<void>;
	onDeleteBookmark: (id: string) => Promise<void>;
	onUpdateBookmark: (id: string, changes: any) => Promise<void>;
	onBookmarkMoved?: () => void;
	onBookmarkMoveOptimized?: (draggedId: string, targetId: string) => Promise<void>;
}

export const BookmarksContainer: React.FC<BookmarksContainerProps> = ({
	bookmarks: _bookmarks,
	folders,
	loading,
	permissionState,
	onRequestPermission,
	onDeleteBookmark,
	onUpdateBookmark,
	onBookmarkMoved,
	onBookmarkMoveOptimized
}) => {
	// 使用onBookmarkMoveOptimized参数
	console.log('onBookmarkMoveOptimized:', onBookmarkMoveOptimized);
	const [editModal, setEditModal] = useState<{
		isOpen: boolean;
		bookmark: Bookmark | null;
	}>({
		isOpen: false,
		bookmark: null
	});



	const handleEdit = (bookmark: Bookmark) => {
		setEditModal({
			isOpen: true,
			bookmark
		});
	};

	const handleSave = async (changes: Partial<Bookmark>) => {
		if (editModal.bookmark) {
			await onUpdateBookmark(editModal.bookmark.id, changes);
			setEditModal({ isOpen: false, bookmark: null });
		}
	};

	const handleCancel = () => {
		setEditModal({ isOpen: false, bookmark: null });
	};

	if (loading) {
		return (
			<div className='loading'>
				<div className='spinner'></div>
				<p>正在加载书签...</p>
			</div>
		);
	}

	if (!permissionState.hasPermission) {
		return (
			<div className='permission-request'>
				<h2>欢迎使用 FastTab</h2>
				<p>为了提供更好的体验，我们需要访问您的书签数据</p>
				<button
					className='permission-button'
					onClick={onRequestPermission}
					disabled={permissionState.isRequesting}
				>
					{permissionState.isRequesting ? '请求中...' : '授权访问书签'}
				</button>
			</div>
		);
	}

	// 检查是否有文件夹
	const hasFolders = folders.length > 0;

	if (!hasFolders) {
		return (
			<div className='empty-state'>
				<h3>暂无书签</h3>
				<p>您还没有添加任何书签，或者书签文件夹为空</p>
			</div>
		);
	}

	return (
		<>
			<main className='bookmarks-container'>
				{/* 显示文件夹结构，文件夹为一级分类 */}
				<div className='folders-section'>
					{folders.map((folder) => (
						<BookmarkFolder
							key={folder.id}
							folder={folder}
							onEdit={handleEdit}
							onDelete={onDeleteBookmark}
							onBookmarkMoved={onBookmarkMoved}
							onBookmarkMoveOptimized={onBookmarkMoveOptimized}
						/>
					))}
				</div>
			</main>

			<EditModal
				isOpen={editModal.isOpen}
				bookmark={editModal.bookmark}
				onSave={handleSave}
				onCancel={handleCancel}
			/>
		</>
	);
};
