import { useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import {
	ThemeMode,
	useBackgroundStore
} from '../../../store/backgroundStore';

type ImageSourceMode = 'upload' | 'url';

export const BackgroundSettings = () => {
	const {
		settings,
		hasLocalBackground,
		saveSettings,
		saveBackgroundFromFile,
		saveBackgroundFromUrl,
		clearBackground
	} = useBackgroundStore();
	const [isOpen, setIsOpen] = useState(false);
	const [themeMode, setThemeMode] = useState<ThemeMode>(settings.themeMode);
	const [sourceMode, setSourceMode] = useState<ImageSourceMode>('upload');
	const [imageUrl, setImageUrl] = useState(settings.value);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setThemeMode(settings.themeMode);
		setImageUrl(settings.value);
	}, [settings]);

	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	}, [previewUrl]);

	const themeOptions: { value: ThemeMode; label: string }[] = [
		{ value: 'system', label: '跟随系统' },
		{ value: 'light', label: '浅色' },
		{ value: 'dark', label: '深色' }
	];

	const handleFileChange = (file?: File) => {
		if (!file) return;
		if (!file.type.startsWith('image/')) {
			message.error('请选择图片文件');
			return;
		}
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setSelectedFile(file);
		setPreviewUrl(URL.createObjectURL(file));
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			if (sourceMode === 'upload' && selectedFile) {
				await saveBackgroundFromFile(selectedFile);
				await saveSettings({
					...settings,
					type: 'image',
					value: '',
					themeMode
				});
			} else if (
				sourceMode === 'url' &&
				imageUrl.trim() &&
				(
					settings.type !== 'image' ||
					imageUrl.trim() !== settings.value ||
					!hasLocalBackground
				)
			) {
				await saveBackgroundFromUrl(imageUrl);
				await saveSettings({
					...settings,
					type: 'image',
					value: imageUrl.trim(),
					themeMode
				});
			} else {
				await saveSettings({ ...settings, themeMode });
			}
			message.success('外观设置已保存');
			setSelectedFile(null);
			setPreviewUrl('');
			setIsOpen(false);
		} catch (error) {
			message.error(error instanceof Error ? error.message : '背景保存失败');
		} finally {
			setIsSaving(false);
		}
	};

	const handleClear = async () => {
		setIsSaving(true);
		try {
			await saveSettings({ ...settings, themeMode });
			await clearBackground();
			setImageUrl('');
			setSelectedFile(null);
			setPreviewUrl('');
			message.success('已恢复主题背景');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className='fixed bottom-5 right-5 z-50'>
			<button
				className='theme-icon-button w-8 h-8 border-none rounded-full shadow-lg cursor-pointer text-xl transition-all duration-300 hover:scale-110 flex items-center justify-center'
				onClick={() => setIsOpen(!isOpen)}
				title='外观设置'>
				🎨
			</button>

			{isOpen && (
				<div className='theme-panel absolute bottom-12 right-0 w-80 rounded-2xl p-4'>
					<div className='flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-color)]'>
						<div>
							<h3 className='m-0 text-base font-semibold'>外观设置</h3>
							<p className='m-0 mt-1 text-xs text-[var(--text-tertiary)]'>图片会保存在本机，打开更快</p>
						</div>
						<button
							className='theme-icon-button w-7 h-7 border-none rounded-full text-xl cursor-pointer'
							onClick={() => setIsOpen(false)}>
							×
						</button>
					</div>

					<div className='flex flex-col gap-4'>
						<div>
							<label className='mb-2 block text-sm font-medium text-[var(--text-secondary)]'>页面主题</label>
							<div className='grid grid-cols-3 gap-2'>
								{themeOptions.map(option => (
									<button
										key={option.value}
										className={`theme-choice rounded-lg px-2 py-2 text-xs cursor-pointer ${themeMode === option.value ? 'is-active' : ''}`}
										onClick={() => setThemeMode(option.value)}>
										{option.label}
									</button>
								))}
							</div>
						</div>

						<div>
							<div className='mb-2 flex items-center justify-between'>
								<label className='text-sm font-medium text-[var(--text-secondary)]'>自定义背景</label>
								{hasLocalBackground && <span className='text-xs text-emerald-500'>已本地化</span>}
							</div>
							<div className='mb-3 grid grid-cols-2 gap-2'>
								<button className={`theme-choice rounded-lg py-2 text-xs ${sourceMode === 'upload' ? 'is-active' : ''}`} onClick={() => setSourceMode('upload')}>上传图片</button>
								<button className={`theme-choice rounded-lg py-2 text-xs ${sourceMode === 'url' ? 'is-active' : ''}`} onClick={() => setSourceMode('url')}>图片 URL</button>
							</div>

							{sourceMode === 'upload' ? (
								<>
									<input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={event => handleFileChange(event.target.files?.[0])} />
									<button className='theme-input w-full rounded-xl p-3 text-left text-sm cursor-pointer' onClick={() => fileInputRef.current?.click()}>
										{selectedFile ? selectedFile.name : '选择本地图片…'}
									</button>
								</>
							) : (
								<div>
									<input
										type='url'
										className='theme-input w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500'
										placeholder='https://example.com/background.jpg'
										value={imageUrl}
										onChange={event => setImageUrl(event.target.value)}
									/>
									<p className='mb-0 mt-1.5 text-xs text-[var(--text-tertiary)]'>首次保存时下载一次，之后从本地读取</p>
								</div>
							)}

							{previewUrl && <img src={previewUrl} alt='背景预览' className='mt-3 h-24 w-full rounded-xl object-cover' />}
						</div>

						<div className='flex gap-2 pt-3 border-t border-[var(--border-color)]'>
							<button className='flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-60' disabled={isSaving} onClick={handleSave}>{isSaving ? '保存中…' : '保存'}</button>
							<button className='theme-secondary-button rounded-lg px-3 py-2 text-sm disabled:opacity-60' disabled={isSaving || settings.type !== 'image'} onClick={handleClear}>恢复默认背景</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
