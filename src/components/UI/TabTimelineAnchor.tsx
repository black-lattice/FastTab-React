import React from 'react';
import { Bookmark } from '../../types';
import './TabTimelineAnchor.css';

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
		<div className='tab-timeline-anchor'>
			<div className='anchor-content'>
				{folders.map((folder) => (
					<div key={folder.id} className='timeline-item'>
						<button
							className='folder-anchor'
							onClick={() => handleFolderClick(folder.id)}
							title={folder.title}
						>
							{folder.title}
						</button>
					</div>
				))}
			</div>
		</div>
	);
};
