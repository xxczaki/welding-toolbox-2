import { useCallback, useEffect, useMemo, useState } from 'react';

import storage from '../storage';
import type { HistoryEntry, Settings } from '../types';
import { sortHistoryByDate } from '../utils/history';

export interface UseHistoryManagementReturn {
	settings: Settings;
	setSettings: React.Dispatch<React.SetStateAction<Settings>>;
	sortedHistory: HistoryEntry[];
	hasHistory: boolean;
	deleteEntry: (id: string) => void;
	clearHistory: () => void;
	isLoading: boolean;
}

export function useHistoryManagement(): UseHistoryManagementReturn {
	const [settings, setSettings] = useState<Settings>({});
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const data = await storage.getItem('settings');

				if (data) {
					setSettings(JSON.parse(data));
				}
			} finally {
				setIsLoading(false);
			}
		})();
	}, []);

	useEffect(() => {
		if (Object.keys(settings).length > 0) {
			(async () => {
				try {
					const data = await storage.getItem('settings');
					const existingSettings = data ? JSON.parse(data) : {};

					await storage.setItem(
						'settings',
						JSON.stringify({ ...existingSettings, ...settings }),
					);
				} catch {}
			})();
		}
	}, [settings]);

	const sortedHistory = useMemo(() => {
		if (!settings?.resultHistory) return [];

		return sortHistoryByDate(settings.resultHistory, 'desc');
	}, [settings?.resultHistory]);

	const hasHistory = sortedHistory.length > 0;

	const deleteEntry = useCallback((id: string) => {
		setSettings((prev) => ({
			...prev,
			resultHistory: prev.resultHistory?.filter((item) => item.id !== id),
		}));
	}, []);

	const clearHistory = useCallback(() => {
		setSettings((prev) => ({
			...prev,
			resultHistory: [],
		}));
	}, []);

	return {
		settings,
		setSettings,
		sortedHistory,
		hasHistory,
		deleteEntry,
		clearHistory,
		isLoading,
	};
}
