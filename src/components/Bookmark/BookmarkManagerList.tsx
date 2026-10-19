import { useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox, Empty, Switch, Tooltip } from 'antd';
import type { Bookmark } from '../../types';
import { BookmarkFavicon } from './BookmarkManagementParts';

const BOOKMARK_RENDER_BATCH_SIZE = 20;
interface Props {
	resetKey: string;
	visibleBookmarks: Bookmark[];
	selectedBookmarkIds: string[];
	includedIds: Set<string>;
	workspaceName: string;
	disabled: boolean;
	setSelectedBookmarkIds: (ids: string[]) => void;
	onIncludedChange: (id: string, included: boolean) => void;
}
export const BookmarkManagerList = ({ resetKey, visibleBookmarks, selectedBookmarkIds, includedIds,
	workspaceName, disabled, setSelectedBookmarkIds, onIncludedChange }: Props) => {
	const [renderLimit, setRenderLimit] = useState(BOOKMARK_RENDER_BATCH_SIZE);
	const listRef = useRef<HTMLElement>(null);
	const renderedBookmarks = visibleBookmarks.slice(0, renderLimit);
	const selectedBookmarkIdSet = useMemo(() => new Set(selectedBookmarkIds), [selectedBookmarkIds]);
	useEffect(() => {
		setRenderLimit(BOOKMARK_RENDER_BATCH_SIZE);
		listRef.current?.scrollTo({ top: 0 });
	}, [resetKey]);
	const allVisibleSelected =
		visibleBookmarks.length > 0 &&
		visibleBookmarks.every(bookmark => selectedBookmarkIdSet.has(bookmark.id));
	const visibleSelectedCount = visibleBookmarks.filter(bookmark =>
		selectedBookmarkIdSet.has(bookmark.id)
	).length;
	const handleListScroll = (event: React.UIEvent<HTMLElement>) => {
		const list = event.currentTarget;
		if (
			renderLimit < visibleBookmarks.length &&
			list.scrollHeight - list.scrollTop - list.clientHeight < 240
		) {
			setRenderLimit(current => Math.min(
				current + BOOKMARK_RENDER_BATCH_SIZE,
				visibleBookmarks.length
			));
		}
	};

	return (
		<section
			ref={listRef}
			className='bookmark-card-list'
			aria-label='书签列表'
			onScroll={handleListScroll}>
			<div className='mb-3 flex items-center justify-between'>
				<Checkbox
					checked={allVisibleSelected}
					indeterminate={visibleSelectedCount > 0 && !allVisibleSelected}
					onChange={event =>
						setSelectedBookmarkIds(
							event.target.checked
								? [...new Set([...selectedBookmarkIds, ...visibleBookmarks.map(bookmark => bookmark.id)])]
								: selectedBookmarkIds.filter(id => !visibleBookmarks.some(bookmark => bookmark.id === id))
						)
					}>
					选择当前结果
				</Checkbox>
				<span className='text-xs text-[var(--text-tertiary)]'>
					{visibleBookmarks.length} 个书签
				</span>
			</div>

			{visibleBookmarks.length ? (
				<div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
					{renderedBookmarks.map(bookmark => {
						const checked = selectedBookmarkIdSet.has(bookmark.id);
						return (
							<article
								key={bookmark.id}
								className={`bookmark-manager-card ${checked ? 'is-selected' : ''}`}>
								<Checkbox
									checked={checked}
									aria-label={`选择 ${bookmark.title}`}
									onChange={event =>
										setSelectedBookmarkIds(
											event.target.checked
												? [...selectedBookmarkIds, bookmark.id]
												: selectedBookmarkIds.filter(id => id !== bookmark.id)
										)
									}
								/>
								<BookmarkFavicon bookmark={bookmark} />
								<a href={bookmark.url} className='min-w-0 flex-1' title={bookmark.title}>
									<strong className='bookmark-card-title'>{bookmark.title}</strong>
									<span className='bookmark-card-url'>{bookmark.url}</span>
								</a>
								<Tooltip title={`是否加入“${workspaceName}”`}>
									<Switch
										size='small'
										checked={includedIds.has(bookmark.id)}
										disabled={disabled}
										onChange={checkedState =>
											onIncludedChange(bookmark.id, checkedState)
										}
										aria-label={`${bookmark.title} ${workspaceName}收录`}
									/>
								</Tooltip>
							</article>
						);
					})}
					{renderedBookmarks.length < visibleBookmarks.length && (
						<button
							type='button'
							className='bookmark-manager-load-more col-span-full'
							onClick={() => setRenderLimit(current => Math.min(
								current + BOOKMARK_RENDER_BATCH_SIZE,
								visibleBookmarks.length
							))}>
							继续显示（剩余 {visibleBookmarks.length - renderedBookmarks.length} 项）
						</button>
					)}
				</div>
			) : (
				<Empty description='没有符合条件的书签' className='mt-20' />
			)}
		</section>
	);
};
