import type { CustomField, ExportField, HistoryEntry } from '../types';

/**
 * Standard history entry keys (used for filtering out custom fields)
 */
export const STANDARD_HISTORY_KEYS = [
	'id',
	'Date',
	'Amperage',
	'Voltage',
	'Total energy',
	'Length',
	'Time',
	'Efficiency factor',
	'Heat Input',
	'Travel Speed',
] as const;

/**
 * Map from export field ID to history entry key
 */
export const EXPORT_FIELD_KEY_MAP: Record<string, string> = {
	date: 'Date',
	heatInput: 'Heat Input',
	voltage: 'Voltage',
	amperage: 'Amperage',
	totalEnergy: 'Total energy',
	length: 'Length',
	time: 'Time',
	efficiency: 'Efficiency factor',
	travelSpeed: 'Travel Speed',
};

/**
 * Get the history entry key for an export field
 * @param field - The export field
 * @param customFields - Array of custom fields from settings
 * @returns The key to use when accessing the history entry
 */
export function getHistoryKey(
	field: ExportField,
	customFields?: CustomField[],
): string {
	if (field.type === 'custom' && field.customFieldTimestamp) {
		const customField = customFields?.find(
			(cf) => cf.timestamp === field.customFieldTimestamp,
		);

		if (customField) {
			return customField.unit
				? `${customField.name} (${customField.unit})`
				: customField.name;
		}
	}

	return EXPORT_FIELD_KEY_MAP[field.id] || field.label;
}

/**
 * Extract custom fields from a history entry
 * @param entry - The history entry
 * @returns Array of [key, value] pairs for custom fields
 */
export function getCustomFieldsFromEntry(
	entry: HistoryEntry,
): Array<[string, string | number]> {
	return Object.entries(entry).filter(
		([key]) =>
			!STANDARD_HISTORY_KEYS.includes(
				key as (typeof STANDARD_HISTORY_KEYS)[number],
			),
	);
}

/**
 * Sort history entries by date (newest first)
 * @param history - Array of history entries
 * @returns Sorted array (does not mutate original)
 */
export function sortHistoryByDate(
	history: HistoryEntry[],
	order: 'asc' | 'desc' = 'desc',
): HistoryEntry[] {
	return [...history].sort((a, b) => {
		const diff = new Date(b.Date).getTime() - new Date(a.Date).getTime();
		return order === 'desc' ? diff : -diff;
	});
}

/**
 * Format a date string for display
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatHistoryDate(dateString: string): string {
	return new Date(dateString).toLocaleString([], {
		dateStyle: 'short',
		timeStyle: 'short',
	});
}
