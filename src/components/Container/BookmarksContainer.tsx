import React from 'react';
import { Bookmark } from '../../types';
import { BookmarkFolder } from '../Bookmark/BookmarkFolder';
import BookmarkCard from '../Bookmark/BookmarkCard';
import { EditModal } from '../UI/EditModal/EditModal';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { useUIStore } from '../../store/uiStore';

export const BookmarksContainer: React.FC = () => {
	const {
		folders,
		bookmarks,
		externalBookmarkIds,
		loading,
		permissionState,
		requestPermission
	} = useBookmarkStore();

	const { isEditModalOpen, editingBookmark, closeEditModal } = useUIStore();
	const { updateBookmark } = useBookmarkStore();
	const externalBookmarks = bookmarks.filter(bookmark =>
		externalBookmarkIds.includes(bookmark.id)
	);

	const handleSave = async (changes: Partial<Bookmark>) => {
		if (editingBookmark) {
			await updateBookmark(editingBookmark.id, changes);
			closeEditModal();
		}
	};

	if (!permissionState.hasPermission) {
		return (
			<div className='text-center p-4 text-[var(--text-primary)] max-w-md mx-auto'>
				<h2 className='text-3xl mb-4'>欢迎使用 FastTab</h2>
				<p className='text-base mb-5 text-[var(--text-secondary)] leading-relaxed'>
					为了提供更好的体验，我们需要访问您的书签数据
				</p>
				<button
					className='theme-glass border-2 text-[var(--text-primary)] px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 backdrop-blur-md hover:bg-[var(--surface-muted)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed'
					onClick={() => requestPermission()}
					disabled={permissionState.isRequesting}
				>
					{permissionState.isRequesting ? '请求中...' : '授权访问书签'}
				</button>
			</div>
		);
	}

	if (loading) {
		return (
			<div className='flex flex-col items-center justify-center p-4 text-[var(--text-primary)]'>
				<div className='w-10 h-10 border-4 border-[var(--border-color)] border-t-[var(--text-primary)] rounded-full animate-spin mb-4'></div>
				<p className='text-base text-[var(--text-secondary)]'>正在加载书签...</p>
			</div>
		);
	}

	// 检查是否有文件夹
	const hasFolders = folders.length > 0;

	if (!hasFolders) {
		return (
			<div className='text-center p-4 text-[var(--text-primary)]'>
				<h3 className='text-2xl mb-2.5'>暂无书签</h3>
				<p className='text-base text-[var(--text-secondary)] leading-relaxed'>
					您还没有添加任何书签，或者书签文件夹为空
				</p>
			</div>
		);
	}

	return (
		<>
			<main className='w-full flex flex-col items-center'>
				<section className='w-full mb-1.5'>
					<div className='grid grid-cols-[repeat(auto-fill,80px)] justify-start w-full gap-4'>
						{externalBookmarks.map(bookmark => (
							<BookmarkCard key={bookmark.id} bookmark={bookmark} />
						))}
						{/* 文件夹紧接外显书签排列，填满当前行后再换行 */}
						{folders.map((folder: Bookmark) => (
							<BookmarkFolder
								key={folder.id}
								folder={folder}
								hiddenBookmarkIds={externalBookmarkIds}
							/>
						))}
					</div>
				</section>
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
