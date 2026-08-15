import {
	useDeferredValue,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { Button, Dropdown } from 'antd';
import {
	DownOutlined,
	GlobalOutlined,
	SearchOutlined
} from '@ant-design/icons';
import { useBookmarkStore } from '../../../store/bookmarkStore';
import { useSearchStore } from '../../../store/searchStore';

const engineBadgeClass: Record<string, string> = {
	google: 'is-google',
	bing: 'is-bing',
	baidu: 'is-baidu'
};

export const SearchSection: React.FC = () => {
	const {
		searchQuery,
		setSearchQuery,
		selectedEngine,
		setSelectedEngine,
		searchEngines,
		performSearch,
		loadSettings
	} = useSearchStore();
	const bookmarks = useBookmarkStore(state => state.bookmarks);
	const deferredQuery = useDeferredValue(searchQuery.trim().toLowerCase());
	const inputRef = useRef<HTMLInputElement>(null);
	const [isFocused, setIsFocused] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);

	useEffect(() => {
		void loadSettings();
	}, [loadSettings]);

	useEffect(() => {
		const handleShortcut = (event: KeyboardEvent) => {
			if (
				(event.metaKey || event.ctrlKey) &&
				['k', 'f'].includes(event.key.toLowerCase())
			) {
				event.preventDefault();
				inputRef.current?.focus();
				inputRef.current?.select();
			}
		};
		window.addEventListener('keydown', handleShortcut);
		return () => window.removeEventListener('keydown', handleShortcut);
	}, []);

	const matchingBookmarks = useMemo(() => {
		if (!deferredQuery) return [];
		return bookmarks
			.map(bookmark => {
				const title = bookmark.title.toLowerCase();
				const url = bookmark.url.toLowerCase();
				const score = title.startsWith(deferredQuery)
					? 0
					: title.includes(deferredQuery)
						? 1
						: url.includes(deferredQuery)
							? 2
							: 3;
				return { bookmark, score };
			})
			.filter(item => item.score < 3)
			.sort((a, b) => a.score - b.score)
			.slice(0, 6)
			.map(item => item.bookmark);
	}, [bookmarks, deferredQuery]);

	const openBookmark = (url: string) => {
		window.location.href = url;
	};
	const handleSearch = () => performSearch(searchQuery);
	const suggestionsVisible =
		isFocused && Boolean(searchQuery.trim()) && matchingBookmarks.length > 0;
	const engineItems = searchEngines.map(engine => ({
		key: engine.value,
		label: (
			<div className='flex min-w-36 items-center gap-3 py-1'>
				<span className={`search-engine-badge ${engineBadgeClass[engine.value]}`}>
					{engine.icon}
				</span>
				<div className='flex flex-col'>
					<span className='font-medium'>{engine.label}</span>
					<span className='text-[11px] text-[var(--text-tertiary)]'>
						使用 {engine.label} 搜索
					</span>
				</div>
			</div>
		)
	}));

	return (
		<header className='relative z-40 mx-auto mb-8 w-full max-w-2xl'>
			<div className='theme-glass search-input-wrapper flex items-center rounded-2xl border p-1.5'>
				<Dropdown
					menu={{
						items: engineItems,
						selectable: true,
						selectedKeys: [selectedEngine.value],
						onClick: ({ key }) => {
							const engine = searchEngines.find(item => item.value === key);
							if (engine) setSelectedEngine(engine);
						}
					}}
					placement='bottomLeft'
					trigger={['click']}>
					<button
						type='button'
						className='search-engine-trigger'
						aria-label='选择搜索引擎'>
						<span className={`search-engine-badge ${engineBadgeClass[selectedEngine.value]}`}>
							{selectedEngine.icon}
						</span>
						<span>{selectedEngine.label}</span>
						<DownOutlined className='text-[9px] text-[var(--text-tertiary)]' />
					</button>
				</Dropdown>

				<div className='mx-1 h-6 w-px bg-[var(--border-color)]' />
				<input
					ref={inputRef}
					type='search'
					className='min-w-0 flex-1 border-none bg-transparent px-3 py-2 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]'
					value={searchQuery}
					onChange={event => {
						setSearchQuery(event.target.value);
						setActiveIndex(-1);
					}}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					onKeyDown={event => {
						if (event.key === 'ArrowDown' && matchingBookmarks.length) {
							event.preventDefault();
							setActiveIndex(index => (index + 1) % matchingBookmarks.length);
						} else if (event.key === 'ArrowUp' && matchingBookmarks.length) {
							event.preventDefault();
							setActiveIndex(index =>
								index <= 0 ? matchingBookmarks.length - 1 : index - 1
							);
						} else if (event.key === 'Enter') {
							const activeBookmark = matchingBookmarks[activeIndex];
							if (activeBookmark) openBookmark(activeBookmark.url);
							else handleSearch();
						} else if (event.key === 'Escape') {
							setIsFocused(false);
							inputRef.current?.blur();
						}
					}}
					placeholder={`搜索书签，或使用 ${selectedEngine.label}`}
					aria-autocomplete='list'
					aria-controls='bookmark-search-results'
					aria-expanded={suggestionsVisible}
					autoFocus
				/>
				<Button
					type='primary'
					shape='circle'
					icon={<SearchOutlined />}
					disabled={!searchQuery.trim()}
					onClick={handleSearch}
					aria-label={`使用 ${selectedEngine.label} 搜索网页`}
				/>
			</div>

			{suggestionsVisible && (
				<div
					id='bookmark-search-results'
					className='theme-panel search-suggestions absolute left-0 right-0 top-[calc(100%+10px)] overflow-hidden rounded-2xl p-2'
					role='listbox'
					onMouseDown={event => event.preventDefault()}>
					<div className='px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]'>
						匹配书签
					</div>
					{matchingBookmarks.map((bookmark, index) => (
						<button
							key={bookmark.id}
							type='button'
							className={`search-suggestion ${activeIndex === index ? 'is-active' : ''}`}
							role='option'
							aria-selected={activeIndex === index}
							onMouseEnter={() => setActiveIndex(index)}
							onClick={() => openBookmark(bookmark.url)}>
							<span className='search-suggestion-icon'>
								{bookmark.title.trim().charAt(0).toUpperCase() || <GlobalOutlined />}
							</span>
							<span className='min-w-0 flex-1 text-left'>
								<strong>{bookmark.title}</strong>
								<small>{bookmark.url}</small>
							</span>
							<span className='text-xs text-[var(--text-tertiary)]'>打开</span>
						</button>
					))}
					<button
						type='button'
						className='search-web-action'
						onClick={handleSearch}>
						<GlobalOutlined />
						<span>使用 {selectedEngine.label} 搜索“{searchQuery.trim()}”</span>
					</button>
				</div>
			)}
		</header>
	);
};
