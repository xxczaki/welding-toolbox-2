import storage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS } from './types';

// Initialize storage with defaults if empty
// This is now lazy-loaded instead of blocking on import
let initialized = false;

export async function initializeStorage(): Promise<void> {
	if (initialized) return;

	try {
		const data = await storage.getItem('settings');
		if (!data || Object.entries(JSON.parse(data)).length === 0) {
			await storage.setItem('settings', JSON.stringify(DEFAULT_SETTINGS));
		}
		initialized = true;
	} catch (error) {
		console.error('Failed to initialize storage:', error);
	}
}

export default storage;
