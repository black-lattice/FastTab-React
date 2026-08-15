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
		rootBookmarkIds,
		loading,
		permissionState,
		requestPermission
	} = useBookmarkStore();

	const {
		isEditModalOpen,
		editingBookmark,
		closeEditModal,
		openAddBookmark
	} = useUIStore();
	const { updateBookmark } = useBookmarkStore();
	const homeBookmarkIds = new Set([
		...rootBookmarkIds,
		...externalBookmarkIds
	]);
	const homeBookmarks = bookmarks.filter(bookmark =>
		homeBookmarkIds.has(bookmark.id)
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
					FastTab 只在本机读取和整理浏览器书签，不会上传书签网址
				</p>
				<button
					className='theme-glass min-h-11 border-2 text-[var(--text-primary)] px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 backdrop-blur-md hover:bg-[var(--surface-muted)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed'
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

	if (folders.length === 0 && homeBookmarks.length === 0) {
		return (
			<div className='text-center p-4 text-[var(--text-primary)]'>
				<h3 className='text-2xl mb-2.5'>暂无书签</h3>
				<p className='mb-5 text-base text-[var(--text-secondary)] leading-relaxed'>
					添加一个常用网址，开始搭建你的新标签页
				</p>
				<button
					type='button'
					className='min-h-11 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
					onClick={openAddBookmark}>
					添加第一个书签
				</button>
			</div>
		);
	}

	return (
		<>
			<main className='w-full flex flex-col items-center'>
				<section className='w-full mb-1.5'>
					<div className='grid grid-cols-[repeat(auto-fill,80px)] justify-start w-full gap-4'>
						{homeBookmarks.map(bookmark => (
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
