import AsyncStorageFactory from '@react-native-community/async-storage';
import LegacyStorage from '@react-native-community/async-storage-backend-legacy';

const legacyStorage = new LegacyStorage();

const storage = AsyncStorageFactory.create(legacyStorage);

// If the storage is empty, supply some defaults
(async () => {
	const data = await storage.get('settings');

	const defaults = {
		resultUnit: 'mm',
		lengthImperial: false,
		totalEnergy: false
	};

	if (!data || Object.entries(JSON.parse(data)).length === 0) {
		storage.set('settings', JSON.stringify(defaults));
	}
})();

export default storage;
