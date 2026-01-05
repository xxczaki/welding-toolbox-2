import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import storage from '../storage';
import type { CustomField, ExportField, Settings } from '../types';
import { DEFAULT_EXPORT_FIELDS } from '../types';

export interface UseExportFieldsManagementReturn {
	settings: Settings;
	setSettings: React.Dispatch<React.SetStateAction<Settings>>;
	exportFields: ExportField[];
	setExportFields: React.Dispatch<React.SetStateAction<ExportField[]>>;
	addCustomField: (name: string, unit: string) => number; // Returns timestamp
	deleteCustomField: (timestamp: number) => void;
	moveField: (fromIndex: number, toIndex: number) => void;
	canAddMore: boolean;
	customFieldCount: number;
	isLoading: boolean;
}

const MAX_CUSTOM_FIELDS = 4;

export function useExportFieldsManagement(): UseExportFieldsManagementReturn {
	const [settings, setSettings] = useState<Settings>({});
	const [exportFields, setExportFields] = useState<ExportField[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useFocusEffect(
		useCallback(() => {
			(async () => {
				try {
					const data = await storage.getItem('settings');
					if (data) {
						const parsed = JSON.parse(data) as Settings;
						setSettings(parsed);

						if (parsed.exportFieldOrder && parsed.exportFieldOrder.length > 0) {
							setExportFields(parsed.exportFieldOrder);
						} else {
							const customFieldEntries: ExportField[] = (
								parsed.customFields || []
							).map((cf) => ({
								id: `custom_${cf.timestamp}`,
								label: cf.unit ? `${cf.name} (${cf.unit})` : cf.name,
								type: 'custom' as const,
								customFieldTimestamp: cf.timestamp,
							}));

							setExportFields([
								...DEFAULT_EXPORT_FIELDS,
								...customFieldEntries,
							]);
						}
					} else {
						setExportFields([...DEFAULT_EXPORT_FIELDS]);
					}
				} catch {
					setExportFields([...DEFAULT_EXPORT_FIELDS]);
				} finally {
					setIsLoading(false);
				}
			})();
		}, []),
	);

	useEffect(() => {
		if (Object.keys(settings).length > 0 || exportFields.length > 0) {
			(async () => {
				try {
					const data = await storage.getItem('settings');
					const existingSettings = data ? JSON.parse(data) : {};

					await storage.setItem(
						'settings',
						JSON.stringify({
							...existingSettings,
							...settings,
							exportFieldOrder: exportFields,
						}),
					);
				} catch {}
			})();
		}
	}, [settings, exportFields]);

	const addCustomField = useCallback((name: string, unit: string): number => {
		const trimmedName = name.trim();
		const trimmedUnit = unit.trim();

		if (!trimmedName) return 0;

		const timestamp = Date.now();
		const newCustomField: CustomField = {
			name: trimmedName,
			unit: trimmedUnit,
			timestamp,
		};

		setSettings((prev) => ({
			...prev,
			customFields: [newCustomField, ...(prev.customFields || [])],
		}));

		const newExportField: ExportField = {
			id: `custom_${timestamp}`,
			label: trimmedUnit ? `${trimmedName} (${trimmedUnit})` : trimmedName,
			type: 'custom',
			customFieldTimestamp: timestamp,
		};
		setExportFields((prev) => [...prev, newExportField]);

		return timestamp;
	}, []);

	const deleteCustomField = useCallback((timestamp: number) => {
		setSettings((prev) => ({
			...prev,
			customFields: prev.customFields?.filter(
				(field) => field.timestamp !== timestamp,
			),
		}));
		setExportFields((prev) =>
			prev.filter((f) => f.customFieldTimestamp !== timestamp),
		);
	}, []);

	const moveField = useCallback((fromIndex: number, toIndex: number) => {
		setExportFields((prev) => {
			const newFields = [...prev];
			const [movedItem] = newFields.splice(fromIndex, 1);

			newFields.splice(toIndex, 0, movedItem);

			return newFields;
		});
	}, []);

	const customFieldCount = settings?.customFields?.length ?? 0;
	const canAddMore = customFieldCount < MAX_CUSTOM_FIELDS;

	return {
		settings,
		setSettings,
		exportFields,
		setExportFields,
		addCustomField,
		deleteCustomField,
		moveField,
		canAddMore,
		customFieldCount,
		isLoading,
	};
}
