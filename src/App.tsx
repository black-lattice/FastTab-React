import { SearchSection } from './components/UI/SearchSection/SearchSection';
import { BookmarksContainer } from './components/Container/BookmarksContainer';
import { BackgroundSettings } from './components/UI/BackgroundSettings/BackgroundSettings';
import BookmarkManager from './components/Bookmark/BookmarkManager';
import { UndoActionBar } from './components/UI/UndoActionBar/UndoActionBar';
import { WorkspaceBar } from './components/Workspace/WorkspaceBar';
import { useBookmarkStore } from './store/bookmarkStore';
import { useBackgroundStore } from './store/backgroundStore';
import { getLayoutMetrics, useLayoutStore } from './store/layoutStore';
import { HOME_WORKSPACE_ID, useWorkspaceStore } from './store/workspaceStore';
import { getWorkspaceContent } from './utils/workspaceContent';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import { useShallow } from 'zustand/react/shallow';

const LAYOUT_COLUMNS_KEY = 'fasttab-layout-columns';
const LAYOUT_ITEMS_KEY = 'fasttab-layout-items';
const ANT_MODAL_CONFIG = { centered: true };

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
		externalBookmarkIds,
		rootBookmarkIds,
		permissionState
	} = useBookmarkStore(useShallow(state => ({
		checkPermission: state.checkPermission,
		loadBookmarks: state.loadBookmarks,
		loadDisplaySettings: state.loadDisplaySettings,
		folders: state.folders,
		bookmarks: state.bookmarks,
		externalBookmarkIds: state.externalBookmarkIds,
		rootBookmarkIds: state.rootBookmarkIds,
		permissionState: state.permissionState
	})));
	const { loadSettings: loadBackgroundSettings, resolvedTheme } = useBackgroundStore(
		useShallow(state => ({
			loadSettings: state.loadSettings,
			resolvedTheme: state.resolvedTheme
		}))
	);
	const layoutSettings = useLayoutStore(state => state.settings);
	const loadLayoutSettings = useLayoutStore(state => state.loadSettings);
	const workspaces = useWorkspaceStore(state => state.workspaces);
	const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId);
	const hiddenHomeFolderIds = useWorkspaceStore(state => state.hiddenHomeFolderIds);
	const loadWorkspaces = useWorkspaceStore(state => state.loadWorkspaces);
	const antDesignTheme = useMemo(() => ({
		algorithm:
			resolvedTheme === 'dark'
				? theme.darkAlgorithm
				: theme.defaultAlgorithm
	}), [resolvedTheme]);

	useEffect(() => {
		if (initializationStarted.current) return;
		initializationStarted.current = true;

		const init = async () => {
			try {
					await Promise.all([
						loadBackgroundSettings(),
						loadDisplaySettings(),
						loadLayoutSettings(),
						loadWorkspaces()
					]);

				const hasPermission = await checkPermission();
				if (hasPermission) {
					await loadBookmarks();
				}
			} finally {
				setIsAppReady(true);
			}
		};
			void init().catch(() => undefined);
	}, [
		checkPermission,
		loadBookmarks,
		loadDisplaySettings,
		loadBackgroundSettings,
		loadLayoutSettings,
		loadWorkspaces
	]);

	useEffect(() => {
		if (!isAppReady || !permissionState.hasPermission) return;

		let refreshTimer: ReturnType<typeof setTimeout> | undefined;
		const refreshBookmarks = () => {
			clearTimeout(refreshTimer);
			refreshTimer = setTimeout(() => {
				void loadBookmarks({ silent: true }).catch(() => undefined);
			}, 120);
		};
		const handleMessage = (
			message: unknown,
			_sender: chrome.runtime.MessageSender,
			sendResponse: (response: { ok: boolean }) => void
		) => {
			if (
				typeof message !== 'object' ||
				message === null ||
				!('action' in message) ||
				message.action !== 'refreshBookmarks'
			) {
				return false;
			}

			void loadBookmarks({ silent: true })
				.then(() => sendResponse({ ok: true }))
				.catch(() => sendResponse({ ok: false }));
			return true;
		};

		chrome.bookmarks.onCreated.addListener(refreshBookmarks);
		chrome.bookmarks.onChanged.addListener(refreshBookmarks);
		chrome.bookmarks.onMoved.addListener(refreshBookmarks);
		chrome.bookmarks.onRemoved.addListener(refreshBookmarks);
		chrome.runtime.onMessage.addListener(handleMessage);

		return () => {
			clearTimeout(refreshTimer);
			chrome.bookmarks.onCreated.removeListener(refreshBookmarks);
			chrome.bookmarks.onChanged.removeListener(refreshBookmarks);
			chrome.bookmarks.onMoved.removeListener(refreshBookmarks);
			chrome.bookmarks.onRemoved.removeListener(refreshBookmarks);
			chrome.runtime.onMessage.removeListener(handleMessage);
		};
	}, [isAppReady, loadBookmarks, permissionState.hasPermission]);

	const activeWorkspace = activeWorkspaceId === HOME_WORKSPACE_ID
		? undefined
		: workspaces.find(workspace => workspace.id === activeWorkspaceId);
	const workspaceContent = getWorkspaceContent(
		bookmarks,
		folders,
		rootBookmarkIds,
		externalBookmarkIds,
		hiddenHomeFolderIds,
		activeWorkspace
	);
	const visibleItemCount = workspaceContent.bookmarks.length + workspaceContent.folders.length;
	const visibleColumnCount = Math.min(
		Math.max(visibleItemCount, 1),
		layoutSettings.maxColumns
	);
	const renderedColumnCount = isAppReady
		? visibleColumnCount
		: Math.min(initialColumnCount, layoutSettings.maxColumns);
	const layoutMetrics = getLayoutMetrics(layoutSettings);
	const contentWidth = Math.max(
		520,
		renderedColumnCount * layoutMetrics.cellSize +
			(renderedColumnCount - 1) * layoutMetrics.gridGap
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

	useEffect(() => {
		ConfigProvider.config({
			holderRender: children => (
				<ConfigProvider modal={ANT_MODAL_CONFIG} theme={antDesignTheme}>
					{children}
				</ConfigProvider>
			)
		});
	}, [antDesignTheme]);

	return (
		<ConfigProvider
			modal={ANT_MODAL_CONFIG}
			theme={antDesignTheme}>
			<div
				className='min-h-screen px-4 md:px-8 flex justify-center'>
				<div
					id='main-content'
					className='w-full flex flex-col pt-[clamp(72px,14vh,150px)] pb-28'
					style={{ maxWidth: `${contentWidth}px` }}>
					{isAppReady ? (
							<>
								<SearchSection />
								<WorkspaceBar />
								<BookmarksContainer />
						</>
					) : (
						<div className='fasttab-skeleton' aria-label='正在加载新标签页'>
							<div className='skeleton-search' />
								<div className='bookmark-grid grid justify-start'>
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
					{isAppReady && <UndoActionBar />}
				</div>
		</ConfigProvider>
	);
}

export default App;
