import storage from '@react-native-async-storage/async-storage';

// If the storage is empty, supply some defaults
(async () => {
	const data = await storage.getItem('settings');

	const defaults = {
		resultUnit: 'mm',
		lengthImperial: false,
		totalEnergy: false,
		resultHistory: [],
		customFields: []
	};

	if (!data || Object.entries(JSON.parse(data)).length === 0) {
		await storage.setItem('settings', JSON.stringify(defaults));
	}
})();

export default storage;
