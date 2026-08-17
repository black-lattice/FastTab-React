import { useState } from 'react';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Input, Modal, Popconfirm, message } from 'antd';
import {
	SearchOpenBehavior,
	useSearchStore
} from '../../../store/searchStore';

interface SearchEngineSettingsModalProps {
	open: boolean;
	onClose: () => void;
}

const openBehaviorOptions: { value: SearchOpenBehavior; label: string }[] = [
	{ value: 'current', label: '当前页' },
	{ value: 'new', label: '新标签页' },
	{ value: 'background', label: '后台标签页' }
];

export const SearchEngineSettingsModal = ({
	open,
	onClose
}: SearchEngineSettingsModalProps) => {
	const customEngines = useSearchStore(state => state.customEngines);
	const openBehavior = useSearchStore(state => state.openBehavior);
	const addCustomEngine = useSearchStore(state => state.addCustomEngine);
	const removeCustomEngine = useSearchStore(state => state.removeCustomEngine);
	const setOpenBehavior = useSearchStore(state => state.setOpenBehavior);
	const [label, setLabel] = useState('');
	const [searchUrl, setSearchUrl] = useState('');
	const [isSaving, setIsSaving] = useState(false);

	const handleAdd = async () => {
		setIsSaving(true);
		try {
			await addCustomEngine(label, searchUrl);
			setLabel('');
			setSearchUrl('');
			message.success('自定义搜索引擎已添加');
		} catch (error) {
			message.error(error instanceof Error ? error.message : '添加失败');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Modal
			title='搜索设置'
			open={open}
			onCancel={onClose}
			footer={null}
			destroyOnHidden>
			<div className='space-y-5 py-2'>
				<section aria-labelledby='search-open-mode-title'>
					<h3 id='search-open-mode-title' className='mb-2 text-sm font-medium'>网页搜索打开方式</h3>
					<div className='grid grid-cols-3 gap-2'>
						{openBehaviorOptions.map(option => (
							<button
								key={option.value}
								type='button'
								className={`theme-choice min-h-11 rounded-lg px-2 text-xs ${openBehavior === option.value ? 'is-active' : ''}`}
								onClick={() => void setOpenBehavior(option.value)}
								aria-pressed={openBehavior === option.value}>
								{option.label}
							</button>
						))}
					</div>
				</section>

				<section className='border-t border-[var(--border-color)] pt-4' aria-labelledby='custom-engine-title'>
					<h3 id='custom-engine-title' className='mb-3 text-sm font-medium'>自定义搜索引擎</h3>
					<div className='space-y-3'>
						<label className='block' htmlFor='custom-engine-name'>
							<span className='mb-1.5 block text-xs text-[var(--text-secondary)]'>名称</span>
							<Input
								id='custom-engine-name'
								value={label}
								onChange={event => setLabel(event.target.value)}
								placeholder='例如：GitHub'
							/>
						</label>
						<label className='block' htmlFor='custom-engine-url'>
							<span className='mb-1.5 block text-xs text-[var(--text-secondary)]'>搜索地址</span>
							<Input
								id='custom-engine-url'
								value={searchUrl}
								onChange={event => setSearchUrl(event.target.value)}
								placeholder='https://example.com/search?q={query}'
							/>
							<span className='mt-1.5 block text-xs text-[var(--text-tertiary)]'>使用 {'{query}'} 表示搜索内容，也兼容 %s</span>
						</label>
						<button
							type='button'
							className='flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white disabled:opacity-60'
							onClick={() => void handleAdd()}
							disabled={isSaving}>
							<PlusOutlined />
							{isSaving ? '添加中…' : '添加并使用'}
						</button>
					</div>
				</section>

				{customEngines.length > 0 && (
					<ul className='m-0 list-none space-y-2 border-t border-[var(--border-color)] pt-4'>
						{customEngines.map(engine => (
							<li key={engine.id} className='flex min-h-11 items-center gap-3 rounded-lg bg-[var(--surface-muted)] px-3'>
								<span className='search-engine-badge'>{engine.icon}</span>
								<span className='min-w-0 flex-1 truncate text-sm'>{engine.label}</span>
								<Popconfirm
									title={`删除 ${engine.label}？`}
									onConfirm={() => void removeCustomEngine(engine.id)}
									okText='删除'
									cancelText='取消'>
									<button type='button' className='theme-icon-button flex h-11 w-11 items-center justify-center rounded-lg' aria-label={`删除 ${engine.label}`}>
										<DeleteOutlined />
									</button>
								</Popconfirm>
							</li>
						))}
					</ul>
				)}
			</div>
		</Modal>
	);
};
