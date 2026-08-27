import { useEffect, useRef, useState } from 'react';
import { Button, Modal, message } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import {
	ThemeMode,
	useBackgroundStore
} from '../../../store/backgroundStore';
import { useLayoutStore } from '../../../store/layoutStore';
import { useUIStore } from '../../../store/uiStore';
import { MAX_BACKGROUND_FILE_SIZE } from '../../../utils/backgroundImage';
import { LayoutSettingsSection } from './LayoutSettingsSection';
import { useShallow } from 'zustand/react/shallow';

type ImageSourceMode = 'upload' | 'url';
type AppearanceSection = 'background' | 'layout';

export const BackgroundSettings = () => {
	const {
		settings,
		hasLocalBackground,
		saveSettings,
		saveBackgroundFromFile,
		saveBackgroundFromUrl,
		clearBackground
	} = useBackgroundStore(useShallow(state => ({
		settings: state.settings,
		hasLocalBackground: state.hasLocalBackground,
		saveSettings: state.saveSettings,
		saveBackgroundFromFile: state.saveBackgroundFromFile,
		saveBackgroundFromUrl: state.saveBackgroundFromUrl,
		clearBackground: state.clearBackground
	})));
	const layoutSettings = useLayoutStore(state => state.settings);
	const saveLayoutSettings = useLayoutStore(state => state.saveSettings);
	const isOpen = useUIStore(state => state.isAppearanceSettingsOpen);
	const closeAppearanceSettings = useUIStore(state => state.closeAppearanceSettings);
	const toggleAppearanceSettings = useUIStore(state => state.toggleAppearanceSettings);
	const [themeMode, setThemeMode] = useState<ThemeMode>(settings.themeMode);
	const [sourceMode, setSourceMode] = useState<ImageSourceMode>('upload');
	const [activeSection, setActiveSection] = useState<AppearanceSection>('background');
	const [imageUrl, setImageUrl] = useState(settings.value);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState('');
	const [layoutDraft, setLayoutDraft] = useState(layoutSettings);
	const [isSaving, setIsSaving] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setThemeMode(settings.themeMode);
		setImageUrl(settings.value);
	}, [settings]);

	useEffect(() => {
		setLayoutDraft(layoutSettings);
	}, [layoutSettings]);

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
		if (file.size > MAX_BACKGROUND_FILE_SIZE) {
			message.error('背景图片不能超过 12MB');
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
				await saveBackgroundFromFile(selectedFile, themeMode);
			} else if (
				sourceMode === 'url' &&
				imageUrl.trim() &&
				(
					settings.type !== 'image' ||
					imageUrl.trim() !== settings.value ||
					!hasLocalBackground
				)
			) {
				await saveBackgroundFromUrl(imageUrl, themeMode);
			} else {
				await saveSettings({ ...settings, themeMode });
			}
			await saveLayoutSettings(layoutDraft);
			message.success('外观设置已保存');
			setSelectedFile(null);
			setPreviewUrl('');
			closeAppearanceSettings();
		} catch (error) {
			message.error(error instanceof Error ? error.message : '背景保存失败');
		} finally {
			setIsSaving(false);
		}
	};

	const handleClear = async () => {
		setIsSaving(true);
		try {
			await clearBackground(themeMode);
			setImageUrl('');
			setSelectedFile(null);
			setPreviewUrl('');
			message.success('已恢复主题背景');
		} catch (error) {
			message.error(error instanceof Error ? error.message : '恢复背景失败');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className='appearance-settings-root fixed bottom-5 right-5'>
			<button
				className={`quick-action-button ${isOpen ? 'is-active' : ''}`}
				onClick={toggleAppearanceSettings}
				aria-label='外观设置'
				aria-expanded={isOpen}
				title='外观设置'>
				<PictureOutlined />
			</button>

			<Modal
				className='appearance-settings-modal'
				title={
					<div className='pr-8'>
						<div>外观设置</div>
						<p className='m-0 mt-1 text-xs font-normal text-[var(--text-tertiary)]'>
							图片会保存在本机，打开更快
						</p>
					</div>
				}
				open={isOpen}
				onCancel={closeAppearanceSettings}
				width={520}
				footer={
					<div className='appearance-settings-actions'>
						<Button
							disabled={isSaving || settings.type !== 'image'}
							onClick={() => void handleClear()}>
							恢复默认背景
						</Button>
						<Button
							type='primary'
							loading={isSaving}
							onClick={() => void handleSave()}>
							保存
						</Button>
					</div>
				}>
					<div className='appearance-section-tabs mb-4 grid grid-cols-2 gap-1 rounded-xl p-1' role='tablist' aria-label='外观设置分类'>
						<button
							type='button'
							className={activeSection === 'background' ? 'is-active' : ''}
							role='tab'
							aria-selected={activeSection === 'background'}
							onClick={() => setActiveSection('background')}>
							主题与背景
						</button>
						<button
							type='button'
							className={activeSection === 'layout' ? 'is-active' : ''}
							role='tab'
							aria-selected={activeSection === 'layout'}
							onClick={() => setActiveSection('layout')}>
							首页布局
						</button>
					</div>

					<div className='appearance-settings-content'>
						{activeSection === 'background' ? (
							<div className='flex flex-col gap-4' role='tabpanel'>
								<div>
							<label className='mb-2 block text-sm font-medium text-[var(--text-secondary)]'>页面主题</label>
							<div className='grid grid-cols-3 gap-2'>
								{themeOptions.map(option => (
									<button
										key={option.value}
										className={`theme-choice min-h-11 rounded-lg px-2 py-2 text-xs cursor-pointer ${themeMode === option.value ? 'is-active' : ''}`}
										onClick={() => setThemeMode(option.value)}
										aria-pressed={themeMode === option.value}>
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
								<button className={`theme-choice min-h-11 rounded-lg py-2 text-xs ${sourceMode === 'upload' ? 'is-active' : ''}`} onClick={() => setSourceMode('upload')} aria-pressed={sourceMode === 'upload'}>上传图片</button>
								<button className={`theme-choice min-h-11 rounded-lg py-2 text-xs ${sourceMode === 'url' ? 'is-active' : ''}`} onClick={() => setSourceMode('url')} aria-pressed={sourceMode === 'url'}>图片 URL</button>
							</div>

							{sourceMode === 'upload' ? (
								<>
									<input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={event => handleFileChange(event.target.files?.[0])} />
									<button className='theme-input min-h-11 w-full rounded-xl p-3 text-left text-sm cursor-pointer' onClick={() => fileInputRef.current?.click()}>
										{selectedFile ? selectedFile.name : '选择本地图片…'}
									</button>
								</>
							) : (
								<div>
								<input
									id='background-image-url'
										type='url'
									className='theme-input min-h-11 w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500'
										placeholder='https://example.com/background.jpg'
										value={imageUrl}
										onChange={event => setImageUrl(event.target.value)}
									/>
									<p className='mb-0 mt-1.5 text-xs text-[var(--text-tertiary)]'>首次保存时下载一次，之后从本地读取</p>
								</div>
							)}

							{previewUrl && <img src={previewUrl} alt='背景预览' className='mt-3 h-24 w-full rounded-xl object-cover' />}
								</div>
							</div>
						) : (
							<div role='tabpanel'>
								<LayoutSettingsSection value={layoutDraft} onChange={setLayoutDraft} />
							</div>
						)}
					</div>
			</Modal>
		</div>
	);
};
