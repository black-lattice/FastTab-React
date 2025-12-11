import { SearchSection } from './components/UI/SearchSection/SearchSection';
import { BookmarksContainer } from './components/Container/BookmarksContainer';
import { BackgroundSettings } from './components/UI/BackgroundSettings/BackgroundSettings';
import BookmarkManager from './components/Bookmark/BookmarkManager';
import { useBookmarks } from './hooks/useBookmarks';

function App() {
	const {
		bookmarks,
		folders,
		loading,
		permissionState,
		requestPermission,
		updateBookmark,
		removeBookmark,
		loadBookmarks,
		moveBookmarkOptimized
	} = useBookmarks();

	const handleRequestPermission = async () => {
		await requestPermission();
	};

	const handleDeleteBookmark = async (id: string) => {
		try {
			await removeBookmark(id);
		} catch (error) {
			console.error('删除书签失败:', error);
			alert('删除失败，请重试');
		}
	};

	const handleUpdateBookmark = async (id: string, changes: any) => {
		try {
			await updateBookmark(id, changes);
		} catch (error) {
			console.error('更新书签失败:', error);
			throw error;
		}
	};

	return (
		<div className='min-h-screen px-8'>
			<div className='flex flex-col'>
				<SearchSection />
				<BookmarksContainer
					bookmarks={bookmarks}
					folders={folders}
					loading={loading}
					permissionState={permissionState}
					onRequestPermission={handleRequestPermission}
					onDeleteBookmark={handleDeleteBookmark}
					onUpdateBookmark={handleUpdateBookmark}
					onBookmarkMoved={loadBookmarks}
					onBookmarkMoveOptimized={moveBookmarkOptimized}
				/>
				<BackgroundSettings />
				<BookmarkManager />
			</div>
		</div>
	);
}

export default App;
