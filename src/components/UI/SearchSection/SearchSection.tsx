import { useEffect } from 'react';
import { Button, Dropdown } from 'antd';
import { DownOutlined, SearchOutlined } from '@ant-design/icons';
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

	useEffect(() => {
		loadSettings();
	}, [loadSettings]);

	const handleSearch = () => performSearch(searchQuery);
	const engineItems = searchEngines.map(engine => ({
		key: engine.value,
		label: (
			<div className='flex min-w-36 items-center gap-3 py-1'>
				<span className={`search-engine-badge ${engineBadgeClass[engine.value]}`}>
					{engine.icon}
				</span>
				<div className='flex flex-col'>
					<span className='font-medium'>{engine.label}</span>
					<span className='text-[10px] text-[var(--text-tertiary)]'>
						使用 {engine.label} 搜索
					</span>
				</div>
			</div>
		)
	}));

	return (
		<header className='rounded-2xl mb-8 z-40 w-full transition-all duration-300'>
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
					type='search'
					className='min-w-0 flex-1 border-none bg-transparent px-3 py-2 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]'
					value={searchQuery}
					onChange={event => setSearchQuery(event.target.value)}
					onKeyDown={event => {
						if (event.key === 'Enter') handleSearch();
					}}
					placeholder={`使用 ${selectedEngine.label} 搜索`}
					autoFocus
				/>
				<Button
					type='primary'
					shape='circle'
					icon={<SearchOutlined />}
					disabled={!searchQuery.trim()}
					onClick={handleSearch}
					aria-label='搜索'
				/>
			</div>
		</header>
	);
};
