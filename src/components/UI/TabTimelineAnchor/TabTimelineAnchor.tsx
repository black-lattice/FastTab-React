import React from 'react';
import { Bookmark } from '../../../types';

interface TabTimelineAnchorProps {
	folders: Bookmark[];
	onFolderClick: (folderId: string) => void;
}

/**
 * 页签时间轴锚点组件
 * 固定在右下角背景组件的上方，提供垂直文件夹导航功能
 */
export const TabTimelineAnchor: React.FC<TabTimelineAnchorProps> = ({
	folders,
	onFolderClick
}) => {
	/**
	 * 处理文件夹点击事件
	 * @param folderId 文件夹ID
	 */
	const handleFolderClick = (folderId: string) => {
		onFolderClick(folderId);

		// 滚动到对应文件夹
		const folderElement = document.getElementById(`folder-${folderId}`);
		if (folderElement) {
			folderElement.scrollIntoView({
				behavior: 'smooth',
				block: 'center'
			});
		}
	};

	return (
		<div className='fixed top-25 left-4 z-[999] rounded-lg overflow-hidden'>
			<div className='flex flex-col gap-2 pl-1 border-l border-white'>
				{folders.map(folder => (
					<div
						key={folder.id}
						className='text-left'>
						<button
							className='w-auto p-0 bg-transparent cursor-pointer text-xs text-white whitespace-nowrap font-medium font-sans transition-all duration-200 hover:text-blue-300 hover:scale-105'
							onClick={() => handleFolderClick(folder.id)}
							title={folder.title}>
							{folder.title}
						</button>
					</div>
				))}
			</div>
		</div>
	);
};
