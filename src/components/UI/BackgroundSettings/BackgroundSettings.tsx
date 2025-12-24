import { useState, useEffect } from 'react';
import { useBackgroundStore, BackgroundSettings as BackgroundConfig } from '../../../store/backgroundStore';

/**
 * 背景设置组件
 * 提供纯色和图片背景设置功能，固定在右下角
 */
export const BackgroundSettings = () => {
	const { settings, saveSettings, clearBackground, loadSettings } = useBackgroundStore();
	const [isOpen, setIsOpen] = useState(false);
	const [tempSettings, setTempSettings] = useState<BackgroundConfig>(settings);

	useEffect(() => {
		loadSettings();
	}, [loadSettings]);

	// 当 store 中的 settings 改变时（例如加载完成），同步更新 tempSettings
	useEffect(() => {
		setTempSettings(settings);
	}, [settings]);

	// 预设颜色选项
	const presetColors = [
		'#f5f5f5',
		'#ffffff',
		'#000000',
		'#ff6b6b',
		'#4ecdc4',
		'#45b7d1',
		'#96ceb4',
		'#ffeaa7',
		'#dda0dd',
		'#98d8c8'
	];

	const handleSave = () => {
		saveSettings(tempSettings);
		setIsOpen(false);
	};

	const handleCancel = () => {
		setTempSettings(settings);
		setIsOpen(false);
	};

	const handleColorChange = (color: string) => {
		setTempSettings({ type: 'color', value: color });
	};

	const handleImageUrlChange = (url: string) => {
		setTempSettings({ type: 'image', value: url });
	};

	return (
		<div className='fixed bottom-5 right-5 z-50'>
			{/* 触发按钮 */}
			<button
				className='w-8 h-8 bg-white border-none rounded-full shadow-lg cursor-pointer text-xl transition-all duration-300 hover:scale-110 hover:shadow-xl flex items-center justify-center'
				onClick={() => setIsOpen(!isOpen)}
				title='背景设置'>
				🎨
			</button>

			{/* 设置面板 */}
			{isOpen && (
				<div className='absolute bottom-16 right-0 w-80 bg-white rounded-xl shadow-xl p-4'>
					<div className='flex justify-between items-center mb-4 pb-3 border-b border-gray-100'>
						<h3 className='text-base font-semibold text-gray-800 m-0'>
							背景设置
						</h3>
						<button
							className='bg-none border-none text-2xl cursor-pointer text-gray-600 p-0 w-7 h-7 rounded-full transition-colors hover:bg-gray-100 flex items-center justify-center'
							onClick={() => setIsOpen(false)}>
							×
						</button>
					</div>

					<div className='flex flex-col gap-4'>
						{/* 背景类型选择 */}
						<div className='flex flex-col gap-2'>
							<label className='text-sm font-medium text-gray-700'>
								背景类型
							</label>
							<div className='flex gap-4'>
								<label className='flex items-center gap-1 cursor-pointer'>
									<input
										type='radio'
										checked={tempSettings.type === 'color'}
										onChange={() =>
											setTempSettings({
												...tempSettings,
												type: 'color'
											})
										}
									/>
									纯色
								</label>
								<label className='flex items-center gap-1 cursor-pointer'>
									<input
										type='radio'
										checked={tempSettings.type === 'image'}
										onChange={() =>
											setTempSettings({
												...tempSettings,
												type: 'image'
											})
										}
									/>
									图片
								</label>
							</div>
						</div>

						{/* 纯色设置 */}
						{tempSettings.type === 'color' && (
							<div className='flex flex-col gap-3'>
								<label className='text-sm font-medium text-gray-700'>
									选择颜色
								</label>
								<div className='grid grid-cols-5 gap-2'>
									{presetColors.map(color => (
										<button
											key={color}
											className={`w-8 h-8 rounded-lg border-2 cursor-pointer transition-all hover:scale-110 ${
												tempSettings.value === color
													? 'border-gray-800 scale-110'
													: 'border-gray-200 hover:border-gray-300'
											}`}
											style={{ backgroundColor: color }}
											onClick={() =>
												handleColorChange(color)
											}
											title={color}
										/>
									))}
								</div>
								<input
									type='color'
									value={tempSettings.value}
									onChange={e =>
										handleColorChange(e.target.value)
									}
									className='w-full h-10 rounded-lg border border-gray-300 cursor-pointer'
								/>
							</div>
						)}

						{/* 图片设置 */}
						{tempSettings.type === 'image' && (
							<div className='flex flex-col gap-2'>
								<label className='text-sm font-medium text-gray-700'>
									图片URL
								</label>
								<input
									type='url'
									placeholder='输入图片URL'
									value={tempSettings.value}
									onChange={e =>
										handleImageUrlChange(e.target.value)
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								/>
							</div>
						)}

						{/* 操作按钮 */}
						<div className='flex gap-2 pt-4 border-t border-gray-100'>
							<button
								className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
								onClick={handleSave}>
								保存
							</button>
							<button
								className='flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
								onClick={handleCancel}>
								取消
							</button>
							<button
								className='px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
								onClick={clearBackground}>
								清除背景
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
