import {
	useDeferredValue,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
	ControlOutlined,
	DownOutlined,
	GlobalOutlined,
	SearchOutlined,
	SettingOutlined
} from '@ant-design/icons';
import { useBookmarkStore } from '../../../store/bookmarkStore';
import { useSearchStore } from '../../../store/searchStore';
import { rankBookmarks } from '../../../utils/bookmarkSearch';
import type { BookmarkPhonetic } from '../../../utils/bookmarkSearch';
import { getNextSearchIndex } from '../../../utils/searchKeyboard';
import { SearchEngineSettingsModal } from './SearchEngineSettingsModal';
import { useSearchCommands } from './useSearchCommands';
import type { SearchCommand } from './useSearchCommands';

const engineBadgeClass: Record<string, string> = {
	google: 'is-google',
	bing: 'is-bing',
	baidu: 'is-baidu'
};

export const SearchSection: React.FC = () => {
	const searchQuery = useSearchStore(state => state.searchQuery);
	const setSearchQuery = useSearchStore(state => state.setSearchQuery);
	const selectedEngine = useSearchStore(state => state.selectedEngine);
	const setSelectedEngine = useSearchStore(state => state.setSelectedEngine);
	const searchEngines = useSearchStore(state => state.searchEngines);
	const performSearch = useSearchStore(state => state.performSearch);
	const loadSettings = useSearchStore(state => state.loadSettings);
	const bookmarkUsage = useSearchStore(state => state.bookmarkUsage);
	const recordBookmarkVisit = useSearchStore(state => state.recordBookmarkVisit);
	const bookmarks = useBookmarkStore(state => state.bookmarks);
	const commands = useSearchCommands();
	const deferredQuery = useDeferredValue(searchQuery.trim().toLowerCase());
	const inputRef = useRef<HTMLInputElement>(null);
	const isComposingRef = useRef(false);
	const phoneticPromiseRef = useRef<Promise<Record<string, BookmarkPhonetic>> | null>(null);
	const [isFocused, setIsFocused] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);
	const [isEngineSettingsOpen, setIsEngineSettingsOpen] = useState(false);
	const [phoneticIndex, setPhoneticIndex] = useState<Record<string, BookmarkPhonetic>>({});

	useEffect(() => {
		void loadSettings();
	}, [loadSettings]);

	useEffect(() => {
		phoneticPromiseRef.current = null;
		setPhoneticIndex({});
	}, [bookmarks]);

	useEffect(() => {
		const shouldLoadPinyin =
			Boolean(deferredQuery) &&
			/^[a-z\d\s]+$/i.test(deferredQuery) &&
			bookmarks.some(bookmark => /[\u3400-\u9fff]/.test(bookmark.title));
		if (!shouldLoadPinyin) return;
		let active = true;
		phoneticPromiseRef.current ||= import('../../../utils/bookmarkPinyin')
			.then(module => module.buildBookmarkPhoneticIndex(bookmarks));
		void phoneticPromiseRef.current.then(index => {
			if (active) setPhoneticIndex(index);
		});
		return () => {
			active = false;
		};
	}, [bookmarks, deferredQuery]);

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

	const isCommandMode = deferredQuery.startsWith('>');
	const commandQuery = deferredQuery.slice(1).trim();
	const matchingCommands = useMemo(() => commands.filter(command =>
		!commandQuery ||
		command.title.toLowerCase().includes(commandQuery) ||
		command.keywords.toLowerCase().includes(commandQuery)
	), [commandQuery, commands]);
	const matchingBookmarks = useMemo(
		() => isCommandMode
			? []
			: rankBookmarks(bookmarks, deferredQuery, bookmarkUsage, phoneticIndex),
		[bookmarkUsage, bookmarks, deferredQuery, isCommandMode, phoneticIndex]
	);
	const resultCount = isCommandMode ? matchingCommands.length : matchingBookmarks.length;
	const suggestionsVisible = isFocused && Boolean(searchQuery.trim());

	const executeCommand = async (command: SearchCommand) => {
		setSearchQuery('');
		setActiveIndex(-1);
		await command.execute();
	};
	const openActiveBookmark = (index: number) => {
		const bookmark = matchingBookmarks[index];
		if (!bookmark) return false;
		recordBookmarkVisit(bookmark.id);
		window.location.href = bookmark.url;
		return true;
	};
	const handlePrimaryAction = () => {
		if (isCommandMode) {
			const command = matchingCommands[activeIndex >= 0 ? activeIndex : 0];
			if (command) void executeCommand(command);
			return;
		}
		if (!openActiveBookmark(activeIndex)) performSearch(searchQuery);
	};

	const engineItems: MenuProps['items'] = [
		...searchEngines.map(engine => ({
			key: engine.id,
			label: (
				<div className='flex min-w-36 items-center gap-3 py-1'>
					<span className={`search-engine-badge ${engineBadgeClass[engine.value] || ''}`}>{engine.icon}</span>
					<div className='flex flex-col'>
						<span className='font-medium'>{engine.label}</span>
						<span className='text-[11px] text-[var(--text-tertiary)]'>使用 {engine.label} 搜索</span>
					</div>
				</div>
			)
		})),
		{ type: 'divider' },
		{ key: 'manage-engines', icon: <SettingOutlined />, label: '管理搜索引擎' }
	];

	return (
		<header className='relative z-40 mx-auto mb-8 w-full max-w-2xl'>
			<div className='theme-glass search-input-wrapper flex items-center rounded-2xl border p-1.5'>
				<Dropdown
					menu={{
						items: engineItems,
						selectable: true,
						selectedKeys: [selectedEngine.id],
						onClick: ({ key }) => {
							if (key === 'manage-engines') {
								setIsEngineSettingsOpen(true);
								return;
							}
							const engine = searchEngines.find(item => item.id === key);
							if (engine) setSelectedEngine(engine);
						}
					}}
					placement='bottomLeft'
					trigger={['click']}>
					<button type='button' className='search-engine-trigger' aria-label='选择搜索引擎'>
						<span className={`search-engine-badge ${engineBadgeClass[selectedEngine.value] || ''}`}>{selectedEngine.icon}</span>
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
					onBlur={() => {
						setIsFocused(false);
						isComposingRef.current = false;
					}}
					onCompositionStart={() => { isComposingRef.current = true; }}
					onCompositionEnd={() => { isComposingRef.current = false; }}
					onKeyDown={event => {
						if (event.key === 'ArrowDown' && resultCount) {
							event.preventDefault();
							setActiveIndex(index => getNextSearchIndex(index, resultCount, 'next'));
						} else if (event.key === 'ArrowUp' && resultCount) {
							event.preventDefault();
							setActiveIndex(index => getNextSearchIndex(index, resultCount, 'previous'));
						} else if (event.key === 'Enter') {
							// IME uses Enter to confirm Chinese/Japanese/Korean candidates.
							// Do not treat that confirmation as a search submission.
							if (isComposingRef.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
							handlePrimaryAction();
						} else if (event.key === 'Escape') {
							setIsFocused(false);
							inputRef.current?.blur();
						}
					}}
					placeholder={`搜索书签，输入 > 执行操作`}
					aria-autocomplete='list'
					aria-controls='fasttab-search-results'
					aria-expanded={suggestionsVisible}
					autoFocus
				/>
				<Button
					type='primary'
					shape='circle'
					icon={isCommandMode ? <ControlOutlined /> : <SearchOutlined />}
					disabled={!searchQuery.trim()}
					onClick={handlePrimaryAction}
					aria-label={isCommandMode ? '执行快捷命令' : `使用 ${selectedEngine.label} 搜索网页`}
				/>
			</div>

			{suggestionsVisible && (
				<div
					id='fasttab-search-results'
					className='theme-panel search-suggestions absolute left-0 right-0 top-[calc(100%+10px)] overflow-hidden rounded-2xl p-2'
					role='listbox'>
					<div className='px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]'>
						{isCommandMode ? '快捷命令' : '匹配书签'}
					</div>
					{isCommandMode ? matchingCommands.map((command, index) => (
						<button
							key={command.id}
							type='button'
							className={`search-suggestion ${activeIndex === index ? 'is-active' : ''}`}
							role='option'
							aria-selected={activeIndex === index}
							onMouseDown={event => event.preventDefault()}
							onMouseEnter={() => setActiveIndex(index)}
							onClick={() => void executeCommand(command)}>
							<span className='search-suggestion-icon'>{command.icon}</span>
							<span className='min-w-0 flex-1 text-left'><strong>{command.title}</strong><small>{command.description}</small></span>
							<span className='text-xs text-[var(--text-tertiary)]'>执行</span>
						</button>
					)) : matchingBookmarks.map((bookmark, index) => (
						<a
							key={bookmark.id}
							href={bookmark.url}
							className={`search-suggestion ${activeIndex === index ? 'is-active' : ''}`}
							role='option'
							aria-selected={activeIndex === index}
							onMouseDown={event => { if (event.button === 0) event.preventDefault(); }}
							onMouseEnter={() => setActiveIndex(index)}
							onClick={() => recordBookmarkVisit(bookmark.id)}>
							<span className='search-suggestion-icon'>{bookmark.title.trim().charAt(0).toUpperCase() || <GlobalOutlined />}</span>
							<span className='min-w-0 flex-1 text-left'><strong>{bookmark.title}</strong><small>{bookmark.url}</small></span>
							<span className='text-xs text-[var(--text-tertiary)]'>打开</span>
						</a>
					))}
					{!isCommandMode && (
						<button type='button' className='search-web-action' onMouseDown={event => event.preventDefault()} onClick={() => performSearch(searchQuery)}>
							<GlobalOutlined />
							<span>使用 {selectedEngine.label} 搜索“{searchQuery.trim()}”</span>
						</button>
					)}
				</div>
			)}

			<SearchEngineSettingsModal
				open={isEngineSettingsOpen}
				onClose={() => setIsEngineSettingsOpen(false)}
			/>
		</header>
	);
};
