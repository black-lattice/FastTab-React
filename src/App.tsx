import { SearchSection } from './components/UI/SearchSection/SearchSection';
import { BookmarksContainer } from './components/Container/BookmarksContainer';
import { BackgroundSettings } from './components/UI/BackgroundSettings/BackgroundSettings';
import BookmarkManager from './components/Bookmark/BookmarkManager';
import { useBookmarkStore } from './store/bookmarkStore';
import { useBackgroundStore } from './store/backgroundStore';
import { useEffect } from 'react';

function App() {
	const {
		checkPermission,
		loadBookmarks,
	} = useBookmarkStore();
	const { loadSettings: loadBackgroundSettings } = useBackgroundStore();

	useEffect(() => {
		const init = async () => {
			// 初始化背景设置
			loadBackgroundSettings();
			
			const hasPermission = await checkPermission();
			if (hasPermission) {
				await loadBookmarks();
			}
		};
		init();
	}, [checkPermission, loadBookmarks, loadBackgroundSettings]);

	return (
		<div className='min-h-screen px-8'>
			<div className='flex flex-col'>
				<SearchSection />
				<BookmarksContainer />
				<BackgroundSettings />
				<BookmarkManager />
			</div>
		</div>
	);
}

export default App;
