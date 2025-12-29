import React from 'react';
import { Bookmark } from '../../types';
import { BookmarkFolder } from '../Bookmark/BookmarkFolder';
import { EditModal } from '../UI/EditModal/EditModal';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { useUIStore } from '../../store/uiStore';

export const BookmarksContainer: React.FC = () => {
	const { folders, loading, permissionState, requestPermission } =
		useBookmarkStore();

	const { isEditModalOpen, editingBookmark, closeEditModal } = useUIStore();
	const { updateBookmark } = useBookmarkStore();

	const handleSave = async (changes: Partial<Bookmark>) => {
		if (editingBookmark) {
			await updateBookmark(editingBookmark.id, changes);
			closeEditModal();
		}
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
					onClick={() => requestPermission()}
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
					{folders.map((folder: Bookmark) => (
						<BookmarkFolder key={folder.id} folder={folder} />
					))}
				</div>
			</main>

			<EditModal
				isOpen={isEditModalOpen}
				bookmark={editingBookmark}
				onSave={handleSave}
				onCancel={closeEditModal}
			/>
		</>
	);
};
