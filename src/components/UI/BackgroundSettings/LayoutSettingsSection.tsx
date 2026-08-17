import type {
	BookmarkIconSize,
	BookmarkTitleLines,
	FolderPosition,
	LayoutDensity,
	LayoutSettings
} from '../../../store/layoutStore';

interface LayoutSettingsSectionProps {
	value: LayoutSettings;
	onChange: (settings: LayoutSettings) => void;
}

const iconSizes: { value: BookmarkIconSize; label: string }[] = [
	{ value: 48, label: '小' },
	{ value: 60, label: '标准' },
	{ value: 72, label: '大' }
];

const densities: { value: LayoutDensity; label: string }[] = [
	{ value: 'compact', label: '紧凑' },
	{ value: 'standard', label: '标准' },
	{ value: 'comfortable', label: '宽松' }
];

const titleLines: { value: BookmarkTitleLines; label: string }[] = [
	{ value: 0, label: '隐藏' },
	{ value: 1, label: '1 行' },
	{ value: 2, label: '2 行' }
];

const folderPositions: { value: FolderPosition; label: string }[] = [
	{ value: 'bookmarks-first', label: '书签优先' },
	{ value: 'folders-first', label: '文件夹优先' }
];

export const LayoutSettingsSection = ({
	value,
	onChange
}: LayoutSettingsSectionProps) => {
	const patchSettings = (changes: Partial<LayoutSettings>) =>
		onChange({ ...value, ...changes });

	const renderChoices = <T extends string | number,>(
		options: { value: T; label: string }[],
		selectedValue: T,
		onSelect: (value: T) => void
	) => (
		<div className={`grid gap-2 ${options.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
			{options.map(option => (
				<button
					key={option.value}
					type='button'
					className={`theme-choice min-h-11 rounded-lg px-2 py-2 text-xs cursor-pointer ${selectedValue === option.value ? 'is-active' : ''}`}
					onClick={() => onSelect(option.value)}
					aria-pressed={selectedValue === option.value}>
					{option.label}
				</button>
			))}
		</div>
	);

	return (
		<section className='space-y-3' aria-labelledby='layout-settings-title'>
			<div>
				<h4 id='layout-settings-title' className='m-0 text-sm font-semibold text-[var(--text-primary)]'>首页布局</h4>
				<p className='mb-0 mt-1 text-xs text-[var(--text-tertiary)]'>只调整显示方式，不会修改 Logo 或书签内容</p>
			</div>

			<div>
				<span className='mb-2 block text-xs font-medium text-[var(--text-secondary)]'>图标大小</span>
				{renderChoices(iconSizes, value.iconSize, iconSize => patchSettings({ iconSize }))}
			</div>
			<div>
				<span className='mb-2 block text-xs font-medium text-[var(--text-secondary)]'>网格间距</span>
				{renderChoices(densities, value.density, density => patchSettings({ density }))}
			</div>
			<div>
				<span className='mb-2 block text-xs font-medium text-[var(--text-secondary)]'>标题显示</span>
				{renderChoices(titleLines, value.titleLines, lines => patchSettings({ titleLines: lines }))}
			</div>
			<div>
				<span className='mb-2 block text-xs font-medium text-[var(--text-secondary)]'>排列顺序</span>
				{renderChoices(folderPositions, value.folderPosition, folderPosition => patchSettings({ folderPosition }))}
			</div>
			<label className='block'>
				<span className='mb-2 block text-xs font-medium text-[var(--text-secondary)]'>每行最多列数</span>
				<select
					className='theme-input min-h-11 w-full rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
					value={value.maxColumns}
					onChange={event => patchSettings({ maxColumns: Number(event.target.value) })}>
					{[6, 8, 10, 12, 16].map(columns => (
						<option key={columns} value={columns}>{columns} 列</option>
					))}
				</select>
			</label>
		</section>
	);
};
