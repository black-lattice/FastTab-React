import React, { useState, useMemo } from 'react';
import { Modal, Table, Space, Button, Dropdown, message, Input, Tag } from 'antd';
import { DeleteOutlined, SearchOutlined, FolderOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Bookmark } from '../../types';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { useUIStore } from '../../store/uiStore';
import { useFavicon } from '../../hooks/useFavicon';

/**
 * 内部图标组件，用于在表格中展示
 */
const TableFavicon: React.FC<{ url: string; title: string }> = ({ url, title }) => {
	const { faviconUrl } = useFavicon(url);
	const firstChar = title?.trim().charAt(0).toUpperCase() || '🔗';

	if (!faviconUrl) {
		return (
			<div className="w-4 h-4 flex items-center justify-center bg-gray-200 rounded text-[10px] text-gray-500 font-bold">
				{firstChar}
			</div>
		);
	}

	return (
		<img
			src={faviconUrl}
			alt=""
			className="w-4 h-4 rounded object-contain"
		/>
	);
};

const BookmarkManagementModal: React.FC = () => {
	const { bookmarks, folders, removeBookmark, moveBookmark } = useBookmarkStore();
	const {
		isBookmarkManagerOpen,
		closeBookmarkManager,
		selectedBookmarkIds,
		setSelectedBookmarkIds
	} = useUIStore();

	const [searchText, setSearchText] = useState('');

	// 搜索过滤
	const filteredBookmarks = useMemo(() => {
		if (!searchText) return bookmarks;
		const lowerSearch = searchText.toLowerCase();
		return bookmarks.filter(b => 
			b.title.toLowerCase().includes(lowerSearch) || 
			b.url.toLowerCase().includes(lowerSearch)
		);
	}, [bookmarks, searchText]);

	// 文件夹映射，用于显示“所在文件夹”
	const folderMap = useMemo(() => {
		const map: Record<string, string> = {};
		folders.forEach(f => {
			map[f.id] = f.title;
			// 递归处理子文件夹（如果存在）
			const traverse = (nodes: Bookmark[]) => {
				nodes.forEach(n => {
					if (!n.url) {
						map[n.id] = n.title;
						if (n.children) traverse(n.children);
					}
				});
			};
			if (f.children) traverse(f.children);
		});
		return map;
	}, [folders]);

	const handleBatchDelete = async () => {
		Modal.confirm({
			title: '确认删除',
			content: `确定要删除选中的 ${selectedBookmarkIds.length} 个书签吗？`,
			okText: '确定',
			okType: 'danger',
			cancelText: '取消',
			onOk: async () => {
				try {
					for (const id of selectedBookmarkIds) {
						await removeBookmark(id);
					}
					message.success(`成功删除 ${selectedBookmarkIds.length} 个书签`);
					setSelectedBookmarkIds([]);
				} catch (error) {
					message.error('部分书签删除失败');
				}
			}
		});
	};

	const handleMoveToFolder = async (bookmarkId: string, folderId: string) => {
		try {
			await moveBookmark(bookmarkId, { parentId: folderId });
			message.success('移动成功');
		} catch (error) {
			message.error('移动失败');
		}
	};

	const handleBatchMove = async (folderId: string) => {
		try {
			for (const id of selectedBookmarkIds) {
				await moveBookmark(id, { parentId: folderId });
			}
			message.success(`成功移动 ${selectedBookmarkIds.length} 个书签`);
			setSelectedBookmarkIds([]);
		} catch (error) {
			message.error('移动书签失败');
		}
	};

	const columns: ColumnsType<Bookmark> = [
		{
			title: '书签',
			key: 'bookmark',
			width: '40%',
			render: (_, record) => (
				<Space>
					<TableFavicon url={record.url} title={record.title} />
					<div className="flex flex-col overflow-hidden">
						<span className="font-medium truncate block" title={record.title}>
							{record.title}
						</span>
						<a 
							href={record.url} 
							target="_blank" 
							rel="noopener noreferrer" 
							className="text-xs text-gray-400 truncate hover:text-blue-500"
							onClick={e => e.stopPropagation()}
						>
							{record.url}
						</a>
					</div>
				</Space>
			)
		},
		{
			title: '所在文件夹',
			dataIndex: 'parentId',
			key: 'folder',
			width: 150,
			render: (parentId) => (
				<Tag icon={<FolderOutlined />} color="blue">
					{folderMap[parentId] || '书签栏'}
				</Tag>
			)
		},
		{
			title: '添加日期',
			dataIndex: 'dateAdded',
			key: 'dateAdded',
			width: 120,
			sorter: (a, b) => (a.dateAdded || 0) - (b.dateAdded || 0),
			render: (date) => date ? new Date(date).toLocaleDateString() : '-'
		},
		{
			title: '操作',
			key: 'action',
			width: 100,
			fixed: 'right',
			render: (_, record) => (
				<Dropdown
					menu={{
						items: folders.map(f => ({
							key: f.id,
							label: f.title,
							icon: <FolderOutlined />,
							onClick: () => handleMoveToFolder(record.id, f.id)
						}))
					}}
					trigger={['click']}
				>
					<Button size="small" type="link">移动</Button>
				</Dropdown>
			)
		}
	];

	const batchMoveItems = folders.map(f => ({
		key: f.id,
		label: f.title,
		icon: <FolderOutlined />,
		onClick: () => handleBatchMove(f.id)
	}));

	return (
		<Modal
			title={
				<div className="flex items-center justify-between pr-8">
					<span>书签管理</span>
					<Input
						placeholder="搜索书签标题或 URL..."
						prefix={<SearchOutlined className="text-gray-400" />}
						variant="filled"
						className="w-64 font-normal"
						onChange={e => setSearchText(e.target.value)}
						allowClear
					/>
				</div>
			}
			open={isBookmarkManagerOpen}
			onCancel={closeBookmarkManager}
			width={900}
			centered
			footer={
				<div className="flex items-center justify-between w-full px-2">
					<div className="text-gray-500 text-sm">
						{selectedBookmarkIds.length > 0 && (
							<span>已选择 <strong className="text-blue-600">{selectedBookmarkIds.length}</strong> 项</span>
						)}
					</div>
					<Space>
						<Button onClick={closeBookmarkManager}>取消</Button>
						<Dropdown
							menu={{ items: batchMoveItems }}
							disabled={selectedBookmarkIds.length === 0}
						>
							<Button disabled={selectedBookmarkIds.length === 0}>
								批量移动
							</Button>
						</Dropdown>
						<Button
							type="primary"
							danger
							icon={<DeleteOutlined />}
							onClick={handleBatchDelete}
							disabled={selectedBookmarkIds.length === 0}
						>
							批量删除
						</Button>
					</Space>
				</div>
			}
		>
			<div className="py-2">
				<Table
					columns={columns}
					dataSource={filteredBookmarks}
					rowKey="id"
					size="middle"
					pagination={{
						pageSize: 50,
						showSizeChanger: true,
						showTotal: (total) => `共 ${total} 条书签`,
						size: 'small'
					}}
					scroll={{ y: 450 }}
					rowSelection={{
						selectedRowKeys: selectedBookmarkIds,
						onChange: (keys) => setSelectedBookmarkIds(keys as string[]),
					}}
				/>
			</div>
		</Modal>
	);
};

export default BookmarkManagementModal;
