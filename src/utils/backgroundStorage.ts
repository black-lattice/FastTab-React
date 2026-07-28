const DATABASE_NAME = 'fasttab-backgrounds';
const STORE_NAME = 'images';
const ACTIVE_BACKGROUND_KEY = 'active-background';

const openDatabase = (): Promise<IDBDatabase> =>
	new Promise((resolve, reject) => {
		const request = indexedDB.open(DATABASE_NAME, 1);
		request.onupgradeneeded = () => {
			if (!request.result.objectStoreNames.contains(STORE_NAME)) {
				request.result.createObjectStore(STORE_NAME);
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});

export const saveBackgroundImage = async (blob: Blob): Promise<void> => {
	const database = await openDatabase();
	await new Promise<void>((resolve, reject) => {
		const transaction = database.transaction(STORE_NAME, 'readwrite');
		transaction.objectStore(STORE_NAME).put(blob, ACTIVE_BACKGROUND_KEY);
		transaction.oncomplete = () => resolve();
		transaction.onerror = () => reject(transaction.error);
	});
	database.close();
};

export const loadBackgroundImage = async (): Promise<Blob | null> => {
	const database = await openDatabase();
	const blob = await new Promise<Blob | null>((resolve, reject) => {
		const request = database
			.transaction(STORE_NAME, 'readonly')
			.objectStore(STORE_NAME)
			.get(ACTIVE_BACKGROUND_KEY);
		request.onsuccess = () => resolve(request.result || null);
		request.onerror = () => reject(request.error);
	});
	database.close();
	return blob;
};

export const clearBackgroundImage = async (): Promise<void> => {
	const database = await openDatabase();
	await new Promise<void>((resolve, reject) => {
		const transaction = database.transaction(STORE_NAME, 'readwrite');
		transaction.objectStore(STORE_NAME).delete(ACTIVE_BACKGROUND_KEY);
		transaction.oncomplete = () => resolve();
		transaction.onerror = () => reject(transaction.error);
	});
	database.close();
};
