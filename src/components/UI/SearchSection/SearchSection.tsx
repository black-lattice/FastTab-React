import { useSearch } from '../../../hooks/useSearch';

export const SearchSection: React.FC = () => {
	const { searchQuery, setSearchQuery, selectedEngine, setSelectedEngine, searchEngines, handleKeyPress } = useSearch();

	return (
		<header className='sticky top-4 rounded-xl p-1.5 mb-4 z-50 w-full max-w-none transition-all duration-300'>
			<div className='w-full'>
				<div className='search-input-wrapper'>
					<select
						className='px-3 py-3 border-none bg-transparent text-sm font-medium cursor-pointer transition-all duration-200 text-indigo-500 min-w-[110px] text-center hover:bg-indigo-500/10 focus:outline-none focus:bg-indigo-500/15'
						value={selectedEngine.value}
						onChange={e => {
							const engine = searchEngines.find((eng: { value: string; label: string }) => eng.value === e.target.value);
							if (engine) setSelectedEngine(engine);
						}}>
						{searchEngines.map((engine: { value: string; label: string }) => (
							<option
								key={engine.value}
								value={engine.value}>
								{engine.label}
							</option>
						))}
					</select>
					<input
						type='text'
						className='flex-1 px-3 py-3 border-none bg-transparent text-base outline-none text-gray-800 placeholder-gray-800'
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						onKeyPress={handleKeyPress}
						placeholder='搜索...'
						autoFocus
					/>
				</div>
			</div>
		</header>
	);
};
