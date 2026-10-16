export const isSearchComposing = (
	event: Pick<KeyboardEvent, 'isComposing' | 'keyCode'>,
	compositionActive: boolean
) => compositionActive || event.isComposing || event.keyCode === 229;

export const getNextSearchIndex = (
	currentIndex: number,
	resultCount: number,
	direction: 'next' | 'previous'
) => {
	if (resultCount <= 0) return -1;
	if (direction === 'next') return (currentIndex + 1) % resultCount;
	return currentIndex <= 0 ? resultCount - 1 : currentIndex - 1;
};
