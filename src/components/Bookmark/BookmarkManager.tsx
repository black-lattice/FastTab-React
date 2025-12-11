import React, { useState } from 'react';
import { Button, message } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useBookmarks } from '../../hooks/useBookmarks';
import BookmarkManagementModal from './BookmarkManagementModal';

/**
 * 书签管理面板组件
 * 提供书签的批量管理和操作功能
 */
const BookmarkManager: React.FC = () => {
	const { bookmarks, removeBookmark, moveBookmark } = useBookmarks();
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [selectedBookmarkIds, setSelectedBookmarkIds] = useState<string[]>(
		[]
	);

	/**
	 * 打开管理模态框
	 */
	const handleOpenModal = () => {
		setIsModalVisible(true);
	};

	/**
	 * 关闭管理模态框
	 */
	const handleCloseModal = () => {
		setIsModalVisible(false);
		setSelectedBookmarkIds([]);
	};

	/**
	 * 处理书签选择变化
	 * @param selectedIds 选中的书签ID数组
	 */
	const handleSelectionChange = (selectedIds: string[]) => {
		setSelectedBookmarkIds(selectedIds);
	};

	/**
	 * 批量删除选中的书签
	 */
	const handleBatchDelete = async () => {
		if (selectedBookmarkIds.length === 0) {
			message.warning('请选择要删除的书签');
			return;
		}

		try {
			for (const id of selectedBookmarkIds) {
				await removeBookmark(id);
			}
			message.success(`成功删除 ${selectedBookmarkIds.length} 个书签`);
			setSelectedBookmarkIds([]);
		} catch (error) {
			message.error('删除书签失败');
		}
	};

	return (
		<div className='fixed right-5 bottom-20 z-50'>
			{/* 管理按钮 */}
			<Button
				className='w-12 h-12 bg-blue-600 border-none rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 flex items-center justify-center'
				type='primary'
				shape='circle'
				icon={<SettingOutlined />}
				onClick={handleOpenModal}
			/>

			{/* 书签管理模态框 */}
			<BookmarkManagementModal
				visible={isModalVisible}
				onClose={handleCloseModal}
				bookmarks={bookmarks}
				selectedBookmarkIds={selectedBookmarkIds}
				onSelectionChange={handleSelectionChange}
				onBatchDelete={handleBatchDelete}
				onMoveBookmark={moveBookmark}
			/>
		</div>
	);
};

export default BookmarkManager;
