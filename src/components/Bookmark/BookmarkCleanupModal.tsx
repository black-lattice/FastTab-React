import { useMemo } from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import { Empty, Modal, message } from 'antd';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import {
	findDuplicateBookmarkGroups,
	findEmptyFolders
} from '../../utils/bookmarkCleanup';

interface BookmarkCleanupModalProps {
	open: boolean;
	onClose: () => void;
}

export const BookmarkCleanupModal = ({ open, onClose }: BookmarkCleanupModalProps) => {
	const bookmarks = useBookmarkStore(state => state.bookmarks);
	const folders = useBookmarkStore(state => state.folders);
	const removeBookmarks = useBookmarkStore(state => state.removeBookmarks);
	const removeEmptyFolders = useBookmarkStore(state => state.removeEmptyFolders);
	const replaceBookmarkReferences = useWorkspaceStore(state => state.replaceBookmarkReferences);
	const duplicateGroups = useMemo(
		() => findDuplicateBookmarkGroups(bookmarks),
		[bookmarks]
	);
	const emptyFolders = useMemo(() => findEmptyFolders(folders), [folders]);
	const duplicateIds = duplicateGroups.flatMap(group => group.slice(1).map(item => item.id));
	const hasFindings = duplicateIds.length > 0 || emptyFolders.length > 0;

	const cleanDuplicates = () => {
		Modal.confirm({
			title: `删除 ${duplicateIds.length} 个重复书签？`,
			content: '每组会保留最早添加的一项，删除后可在页面底部撤销。',
			okText: '删除重复项',
			okType: 'danger',
			cancelText: '取消',
				onOk: async () => {
					try {
						await removeBookmarks(duplicateIds);
						await replaceBookmarkReferences(duplicateGroups.flatMap(group =>
							group.slice(1).map(bookmark => ({
								oldId: bookmark.id,
								newId: group[0].id,
								isFolder: false
							}))
						));
						message.success('重复书签已清理');
				} catch (error) {
					message.error(error instanceof Error ? error.message : '清理失败');
				}
			}
		});
	};
	const cleanEmptyFolders = () => {
		Modal.confirm({
			title: `删除 ${emptyFolders.length} 个空文件夹？`,
			content: '只会删除当前没有任何内容的文件夹，删除后可撤销。',
			okText: '删除空文件夹',
			okType: 'danger',
			cancelText: '取消',
			onOk: async () => {
				try {
					await removeEmptyFolders(emptyFolders.map(folder => folder.id));
					message.success('空文件夹已清理');
				} catch (error) {
					message.error(error instanceof Error ? error.message : '清理失败');
				}
			}
		});
	};

	return (
		<Modal
			title='书签整理'
			open={open}
			onCancel={onClose}
			footer={null}
			width={640}
			destroyOnHidden>
			<div className='space-y-4 py-2'>
				{!hasFindings && <Empty description='没有发现重复书签或空文件夹' />}

				{duplicateIds.length > 0 && (
					<section className='theme-panel rounded-xl p-4'>
						<div className='flex flex-wrap items-start justify-between gap-3'>
							<div>
								<h3 className='m-0 text-base font-semibold'>重复书签</h3>
								<p className='mb-0 mt-1 text-xs text-[var(--text-tertiary)]'>发现 {duplicateGroups.length} 组，可移除 {duplicateIds.length} 项</p>
							</div>
							<button type='button' className='flex min-h-11 items-center gap-2 rounded-lg bg-red-500 px-4 text-sm text-white' onClick={cleanDuplicates}>
								<DeleteOutlined />清理重复项
							</button>
						</div>
						<ul className='mb-0 mt-3 max-h-44 space-y-2 overflow-y-auto pl-5 text-sm text-[var(--text-secondary)]'>
							{duplicateGroups.map(group => (
								<li key={group[0].url}>
									<strong className='text-[var(--text-primary)]'>{group[0].title || group[0].url}</strong>
									<span className='ml-2 text-xs'>重复 {group.length} 次</span>
								</li>
							))}
						</ul>
					</section>
				)}

				{emptyFolders.length > 0 && (
					<section className='theme-panel rounded-xl p-4'>
						<div className='flex flex-wrap items-start justify-between gap-3'>
							<div>
								<h3 className='m-0 text-base font-semibold'>空文件夹</h3>
								<p className='mb-0 mt-1 text-xs text-[var(--text-tertiary)]'>发现 {emptyFolders.length} 个没有内容的文件夹</p>
							</div>
							<button type='button' className='flex min-h-11 items-center gap-2 rounded-lg bg-red-500 px-4 text-sm text-white' onClick={cleanEmptyFolders}>
								<DeleteOutlined />删除空文件夹
							</button>
						</div>
						<p className='mb-0 mt-3 text-sm text-[var(--text-secondary)]'>{emptyFolders.map(folder => folder.title || '未命名文件夹').join('、')}</p>
					</section>
				)}
			</div>
		</Modal>
	);
};
