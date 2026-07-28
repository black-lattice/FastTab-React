import { SearchSection } from './components/UI/SearchSection/SearchSection';
import { BookmarksContainer } from './components/Container/BookmarksContainer';
import { BackgroundSettings } from './components/UI/BackgroundSettings/BackgroundSettings';
import BookmarkManager from './components/Bookmark/BookmarkManager';
import { useBookmarkStore } from './store/bookmarkStore';
import { useBackgroundStore } from './store/backgroundStore';
import { useEffect, useRef, useState } from 'react';
import { ConfigProvider, theme } from 'antd';

const LAYOUT_COLUMNS_KEY = 'fasttab-layout-columns';
const LAYOUT_ITEMS_KEY = 'fasttab-layout-items';

function App() {
	const initializationStarted = useRef(false);
	const [isAppReady, setIsAppReady] = useState(false);
	const [initialColumnCount] = useState(() => {
		const cachedColumns = Number(localStorage.getItem(LAYOUT_COLUMNS_KEY));
		return cachedColumns >= 1 && cachedColumns <= 12 ? cachedColumns : 12;
	});
	const [initialItemCount] = useState(() => {
		const cachedItems = Number(localStorage.getItem(LAYOUT_ITEMS_KEY));
		return cachedItems >= 1 && cachedItems <= 240 ? cachedItems : 12;
	});
	const {
		checkPermission,
		loadBookmarks,
		loadDisplaySettings,
		folders,
		bookmarks,
		externalBookmarkIds
	} = useBookmarkStore();
	const { loadSettings: loadBackgroundSettings, resolvedTheme } = useBackgroundStore();

	useEffect(() => {
		if (initializationStarted.current) return;
		initializationStarted.current = true;

		const init = async () => {
			try {
				await Promise.all([
					loadBackgroundSettings(),
					loadDisplaySettings()
				]);

				const hasPermission = await checkPermission();
				if (hasPermission) {
					await loadBookmarks();
				}
			} finally {
				setIsAppReady(true);
			}
		};
		init();
	}, [
		checkPermission,
		loadBookmarks,
		loadDisplaySettings,
		loadBackgroundSettings
	]);

	const externalBookmarkCount = bookmarks.filter(bookmark =>
		externalBookmarkIds.includes(bookmark.id)
	).length;
	const visibleItemCount = externalBookmarkCount + folders.length;
	const visibleColumnCount = Math.min(Math.max(visibleItemCount, 1), 12);
	const renderedColumnCount = isAppReady
		? visibleColumnCount
		: initialColumnCount;
	const contentWidth = Math.max(
		360,
		renderedColumnCount * 80 + (renderedColumnCount - 1) * 16
	);

	useEffect(() => {
		if (isAppReady) {
			localStorage.setItem(LAYOUT_COLUMNS_KEY, String(visibleColumnCount));
			localStorage.setItem(
				LAYOUT_ITEMS_KEY,
				String(Math.max(visibleItemCount, 1))
			);
		}
	}, [isAppReady, visibleColumnCount, visibleItemCount]);

	return (
		<ConfigProvider
			theme={{
				algorithm:
					resolvedTheme === 'dark'
						? theme.darkAlgorithm
						: theme.defaultAlgorithm
			}}>
			<div
				className='min-h-screen px-4 md:px-8 flex items-center justify-center'>
				<div
					className='w-full flex flex-col py-12 md:-translate-y-[5vh]'
					style={{ maxWidth: `${contentWidth}px` }}>
					{isAppReady ? (
						<>
							<SearchSection />
							<BookmarksContainer />
						</>
					) : (
						<div className='fasttab-skeleton' aria-label='正在加载新标签页'>
							<div className='skeleton-search' />
							<div className='grid grid-cols-[repeat(auto-fill,80px)] justify-start gap-4'>
								{Array.from({ length: initialItemCount }).map((_, index) => (
									<div key={index} className='skeleton-bookmark'>
										<div className='skeleton-bookmark-icon' />
										<div className='skeleton-bookmark-title' />
									</div>
								))}
							</div>
						</div>
					)}
				</div>
				{isAppReady && <BackgroundSettings />}
				{isAppReady && <BookmarkManager />}
			</div>
		</ConfigProvider>
	);
}

export default App;
