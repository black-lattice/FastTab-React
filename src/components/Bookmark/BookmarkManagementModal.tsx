import React, { useState } from 'react';
import { Modal, Table, Space, Button, Dropdown, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Bookmark } from '../../types';
import { useBookmarks } from '../../hooks/useBookmarks';
import './BookmarkManagementModal.css';

interface BookmarkManagementModalProps {
	visible: boolean;
	onClose: () => void;
	bookmarks: Bookmark[];
	selectedBookmarkIds: string[];
	onSelectionChange: (selectedIds: string[]) => void;
	onBatchDelete: () => void;
	onMoveBookmark: (
		id: string,
		destination: { parentId?: string; index?: number }
	) => Promise<void>;
}

/**
 * 书签管理模态框组件
 * 提供书签的表格展示、选择和批量操作功能
 */
const BookmarkManagementModal: React.FC<BookmarkManagementModalProps> = ({
	visible,
	onClose,
	bookmarks,
	selectedBookmarkIds,
	onSelectionChange,
	onBatchDelete,
	onMoveBookmark
}) => {
	const { folders } = useBookmarks();
	const [movingBookmarkId, setMovingBookmarkId] = useState<string | null>(null);

	/**
	 * 格式化日期显示
	 * @param date 日期字符串或数字
	 * @returns 格式化后的日期字符串
	 */
	const formatDate = (date: string | number | undefined): string => {
		if (!date) return '-';
		return new Date(date)
			.toLocaleString('zh-CN', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit'
			})
			.replace(/\//g, '-');
	};

	/**
	 * 处理行选择变化
	 * @param selectedRowKeys 选中的行key数组
	 */
	const handleRowSelectionChange = (selectedRowKeys: React.Key[]) => {
		onSelectionChange(selectedRowKeys as string[]);
	};

	/**
	 * 移动书签到指定文件夹
	 * @param bookmarkId 书签ID
	 * @param folderId 目标文件夹ID
	 */
	const handleMoveToFolder = async (bookmarkId: string, folderId: string) => {
		try {
			setMovingBookmarkId(bookmarkId);
			await onMoveBookmark(bookmarkId, { parentId: folderId });
			message.success('移动成功');
		} catch (error) {
			message.error('移动失败');
		} finally {
			setMovingBookmarkId(null);
		}
	};

	/**
	 * 批量移动选中的书签
	 * @param folderId 目标文件夹ID
	 */
	const handleBatchMove = async (folderId: string) => {
		if (selectedBookmarkIds.length === 0) {
			message.warning('请选择要移动的书签');
			return;
		}

		try {
			for (const id of selectedBookmarkIds) {
				await onMoveBookmark(id, { parentId: folderId });
			}
			message.success(`成功移动 ${selectedBookmarkIds.length} 个书签`);
			onSelectionChange([]);
		} catch (error) {
			message.error('移动书签失败');
		}
	};

	// 表格列配置
	const columns: ColumnsType<Bookmark> = [
		{
			title: '选择',
			dataIndex: 'id',
			width: 60,
			render: (id: string) => (
				<input
					type='checkbox'
					checked={selectedBookmarkIds.includes(id)}
					onChange={(e) => {
						if (e.target.checked) {
							onSelectionChange([...selectedBookmarkIds, id]);
						} else {
							onSelectionChange(
								selectedBookmarkIds.filter((selectedId) => selectedId !== id)
							);
						}
					}}
				/>
			)
		},
		{
			title: '图标',
			dataIndex: 'url',
			width: 60,
			render: (url: string) => (
				<img
					src={`https://www.google.com/s2/favicons?domain=${url}&sz=32`}
					alt='favicon'
					width={16}
					height={16}
					style={{ marginRight: 8 }}
				/>
			)
		},
		{
			title: '标题',
			dataIndex: 'title',
			key: 'title',
			ellipsis: true
		},
		{
			title: 'URL',
			dataIndex: 'url',
			key: 'url',
			ellipsis: true,
			render: (url: string) => (
				<a href={url} target='_blank' rel='noopener noreferrer' title={url}>
					{url}
				</a>
			)
		},
		{
			title: '收藏日期',
			dataIndex: 'dateAdded',
			key: 'dateAdded',
			width: 150,
			render: (dateAdded: number) => formatDate(dateAdded)
		},
		{
			title: '操作',
			key: 'action',
			width: 120,
			render: (_, record) => (
				<Space size='small'>
					<Dropdown
						menu={{
							items: folders.map((folder) => ({
								key: folder.id,
								label: folder.title,
								onClick: () => handleMoveToFolder(record.id, folder.id)
							}))
						}}
						trigger={['click']}
					>
						<Button
							size='small'
							loading={movingBookmarkId === record.id}
							disabled={movingBookmarkId !== null}
						>
							移动
						</Button>
					</Dropdown>
				</Space>
			)
		}
	];

	// 批量操作下拉菜单项
	const batchOperationItems = folders.map((folder) => ({
		key: folder.id,
		label: `移动到 ${folder.title}`,
		onClick: () => handleBatchMove(folder.id)
	}));

	return (
		<Modal
			title='书签管理'
			open={visible}
			onCancel={onClose}
			footer={[
				<Button key='close' onClick={onClose}>
					关闭
				</Button>,
				<Dropdown
					key='move'
					menu={{ items: batchOperationItems }}
					disabled={selectedBookmarkIds.length === 0}
				>
					<Button type='primary' disabled={selectedBookmarkIds.length === 0}>
						批量移动
					</Button>
				</Dropdown>,
				<Button
					key='delete'
					type='primary'
					danger
					icon={<DeleteOutlined />}
					onClick={onBatchDelete}
					disabled={selectedBookmarkIds.length === 0}
				>
					批量删除
				</Button>
			]}
			width='70%'
			style={{ height: '70vh' }}
		>
			<div className='bookmark-management-content'>
				<div className='batch-operations'>
					<span>已选择 {selectedBookmarkIds.length} 个书签</span>
				</div>

				<Table
					columns={columns}
					dataSource={bookmarks}
					rowKey='id'
					pagination={false}
					scroll={{ y: 'calc(50vh - 150px)' }}
					rowSelection={{
						selectedRowKeys: selectedBookmarkIds,
						onChange: handleRowSelectionChange,
						selections: [
							Table.SELECTION_ALL,
							Table.SELECTION_INVERT,
							Table.SELECTION_NONE
						]
					}}
				/>
			</div>
		</Modal>
	);
};

export default BookmarkManagementModal;
