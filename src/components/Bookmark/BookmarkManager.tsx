import React from 'react';
import { Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import BookmarkManagementModal from './BookmarkManagementModal';
import { useUIStore } from '../../store/uiStore';

/**
 * 书签管理面板组件
 * 提供书签的批量管理和操作功能
 */
const BookmarkManager: React.FC = () => {
	const { openBookmarkManager } = useUIStore();

	return (
		<div className='fixed right-5 bottom-20 z-50'>
			{/* 管理按钮 */}
			<Button
				className='w-12 h-12 bg-blue-600 border-none rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 flex items-center justify-center'
				type='primary'
				shape='circle'
				icon={<SettingOutlined />}
				onClick={openBookmarkManager}
			/>

			{/* 书签管理模态框 */}
			<BookmarkManagementModal />
		</div>
	);
};

export default BookmarkManager;
