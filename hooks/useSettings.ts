import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import storage from '../storage';
import type { Settings } from '../types';

interface UseSettingsReturn {
	settings: Settings;
	updateSettings: (updates: Partial<Settings>) => void;
	isLoading: boolean;
}
export function useSettings(): UseSettingsReturn {
	const [settings, setSettings] = useState<Settings>({});
	const [isLoading, setIsLoading] = useState<boolean>(true);

	useFocusEffect(
		useCallback(() => {
			let isMounted = true;

			(async () => {
				try {
					const data = await storage.getItem('settings');

					if (data && isMounted) {
						setSettings(JSON.parse(data));
					}
				} finally {
					if (isMounted) {
						setIsLoading(false);
					}
				}
			})();

			return () => {
				isMounted = false;
			};
		}, []),
	);

	const updateSettings = useCallback(async (updates: Partial<Settings>) => {
		try {
			// Optimistic update
			setSettings((prev) => {
				const newSettings = { ...prev, ...updates };

				(async () => {
					try {
						await storage.setItem('settings', JSON.stringify(newSettings));
					} catch {}
				})();

				return newSettings;
			});
		} catch {}
	}, []);

	return {
		settings,
		updateSettings,
		isLoading,
	};
}
