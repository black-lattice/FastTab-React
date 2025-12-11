import React, { useState } from 'react';
import { Bookmark } from '../../types';
import { BookmarkFolder } from '../Bookmark/BookmarkFolder';
import { EditModal } from '../UI/EditModal/EditModal';

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
	onBookmarkMoveOptimized?: (
		draggedId: string,
		targetId: string
	) => Promise<void>;
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
			<div className='flex flex-col items-center justify-center p-4 text-white'>
				<div className='w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4'></div>
				<p className='text-base text-white/80'>正在加载书签...</p>
			</div>
		);
	}

	if (!permissionState.hasPermission) {
		return (
			<div className='text-center p-4 text-white max-w-md mx-auto'>
				<h2 className='text-3xl mb-4 text-white'>欢迎使用 FastTab</h2>
				<p className='text-base mb-5 text-white/80 leading-relaxed'>
					为了提供更好的体验，我们需要访问您的书签数据
				</p>
				<button
					className='bg-white/20 border-2 border-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 backdrop-blur-md hover:bg-white/30 hover:border-white/50 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed'
					onClick={onRequestPermission}
					disabled={permissionState.isRequesting}>
					{permissionState.isRequesting
						? '请求中...'
						: '授权访问书签'}
				</button>
			</div>
		);
	}

	// 检查是否有文件夹
	const hasFolders = folders.length > 0;

	if (!hasFolders) {
		return (
			<div className='text-center p-4 text-white'>
				<h3 className='text-2xl mb-2.5 text-white'>暂无书签</h3>
				<p className='text-base text-white/70 leading-relaxed'>
					您还没有添加任何书签，或者书签文件夹为空
				</p>
			</div>
		);
	}

	return (
		<>
			<main className='w-full'>
				{/* 显示文件夹结构，文件夹为一级分类 */}
				<div className='mb-1.5'>
					{folders.map(folder => (
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
