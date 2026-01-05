import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { nanoid } from 'nanoid/non-secure';
import { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';

import type { Settings } from '../types';
import { DEFAULT_EXPORT_FIELDS } from '../types';
import { getHistoryKey, sortHistoryByDate } from '../utils/history';

export interface UseHistoryExportProps {
	settings: Settings;
}

export interface UseHistoryExportReturn {
	shareHistory: () => Promise<{ success: boolean; error?: string }>;
	isExporting: boolean;
}

export function useHistoryExport({
	settings,
}: UseHistoryExportProps): UseHistoryExportReturn {
	const [isExporting, setIsExporting] = useState(false);

	const shareHistory = useCallback(async (): Promise<{
		success: boolean;
		error?: string;
	}> => {
		if (!settings?.resultHistory || settings.resultHistory.length === 0) {
			return { success: false, error: 'No history to export' };
		}

		setIsExporting(true);

		try {
			const sortedHistory = sortHistoryByDate(settings.resultHistory, 'asc');

			const exportFieldOrder =
				settings.exportFieldOrder && settings.exportFieldOrder.length > 0
					? settings.exportFieldOrder
					: DEFAULT_EXPORT_FIELDS;

			const orderedArray = sortedHistory.map((entry) => {
				const orderedEntry: Record<string, string | number> = {};

				for (const field of exportFieldOrder) {
					const key = getHistoryKey(field, settings.customFields);

					if (key in entry) {
						orderedEntry[key] = entry[key];
					}
				}

				return orderedEntry;
			});

			const ws = XLSX.utils.json_to_sheet(orderedArray);
			const wb = XLSX.utils.book_new();

			XLSX.utils.book_append_sheet(wb, ws, 'WeldingToolbox2History');

			const id = nanoid(5);

			const wbout = XLSX.write(wb, {
				type: 'base64',
				bookType: 'xlsx',
			});

			const filePath = `${FileSystem.documentDirectory}result-history-${id}.xlsx`;

			await FileSystem.writeAsStringAsync(filePath, wbout, {
				encoding: 'base64',
			});

			if (!(await Sharing.isAvailableAsync())) {
				setIsExporting(false);
				return {
					success: false,
					error: 'Sharing is not available on this device',
				};
			}

			await Sharing.shareAsync(filePath, {
				mimeType:
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				dialogTitle: 'Result history',
				UTI: 'com.microsoft.excel.xlsx',
			});

			setIsExporting(false);
			return { success: true };
		} catch {
			setIsExporting(false);
			return {
				success: false,
				error: 'Failed to export history. Please try again.',
			};
		}
	}, [settings]);

	return {
		shareHistory,
		isExporting,
	};
}
