import { useSearch } from '../../../hooks/useSearch';
import './SearchSection.css';

export const SearchSection: React.FC = () => {
	const { searchQuery, setSearchQuery, selectedEngine, setSelectedEngine, searchEngines, handleKeyPress } = useSearch();

	return (
		<header className='search-section'>
			<div className='search-container'>
				<div className='search-input-wrapper'>
					<select
						className='search-engine-select'
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
						className='search-input'
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
