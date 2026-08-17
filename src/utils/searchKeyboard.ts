export const getNextSearchIndex = (
	currentIndex: number,
	resultCount: number,
	direction: 'next' | 'previous'
) => {
	if (resultCount <= 0) return -1;
	if (direction === 'next') return (currentIndex + 1) % resultCount;
	return currentIndex <= 0 ? resultCount - 1 : currentIndex - 1;
};
