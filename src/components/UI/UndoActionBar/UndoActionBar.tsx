import { useEffect } from 'react';
import { CloseOutlined, UndoOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { useBookmarkStore } from '../../../store/bookmarkStore';

export const UndoActionBar = () => {
	const action = useBookmarkStore(state => state.lastUndoAction);
	const isUndoing = useBookmarkStore(state => state.isUndoing);
	const undoLastAction = useBookmarkStore(state => state.undoLastAction);
	const clearUndoAction = useBookmarkStore(state => state.clearUndoAction);

	useEffect(() => {
		if (!action) return;
		const timer = window.setTimeout(clearUndoAction, 8000);
		return () => window.clearTimeout(timer);
	}, [action, clearUndoAction]);

	if (!action) return null;

	const handleUndo = async () => {
		try {
			await undoLastAction();
			message.success('操作已撤销');
		} catch (error) {
			message.error(error instanceof Error ? error.message : '撤销失败，请重试');
		}
	};

	return (
		<div className='undo-action-bar' role='status' aria-live='polite'>
			<span>{action.label}</span>
			<button
				type='button'
				className='undo-action-button'
				onClick={() => void handleUndo()}
				disabled={isUndoing}>
				<UndoOutlined />
				{isUndoing ? '撤销中…' : '撤销'}
			</button>
			<button
				type='button'
				className='undo-action-close'
				onClick={clearUndoAction}
				aria-label='关闭撤销提示'>
				<CloseOutlined />
			</button>
		</div>
	);
};
