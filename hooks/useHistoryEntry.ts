import { nanoid } from 'nanoid/non-secure';

import type { HistoryEntry, Settings } from '../types';
import { parseDecimal } from '../utils/parse-decimal';
import { toSeconds } from '../utils/to-seconds';

export interface CreateHistoryEntryParams {
	amperage: string;
	voltage: string;
	length: string;
	totalEnergy: string;
	time: string;
	efficiencyFactor: string;
	calculatedResult: number;
	calculatedTravelSpeed: number;
	customFieldValues: Record<string, string>;
	settings: Settings;
}

/**
 * Create a history entry from form data
 * @returns The history entry, or null if there's no valid result
 */
export function createHistoryEntry(
	params: CreateHistoryEntryParams,
): HistoryEntry | null {
	const {
		amperage,
		voltage,
		length,
		totalEnergy,
		time,
		efficiencyFactor,
		calculatedResult,
		calculatedTravelSpeed,
		customFieldValues,
		settings,
	} = params;

	if (calculatedResult === 0) {
		return null;
	}

	const customFieldsData: Record<string, string> = {};

	if (settings?.customFields) {
		for (const field of settings.customFields) {
			const key = field.unit ? `${field.name} (${field.unit})` : field.name;
			customFieldsData[key] = customFieldValues[field.name] || 'N/A';
		}
	}

	const travelSpeedFormatted =
		calculatedTravelSpeed > 0
			? `${calculatedTravelSpeed} ${settings?.travelSpeedUnit || 'mm/min'}`
			: 'N/A';

	const historyEntry: HistoryEntry = {
		id: nanoid(),
		Date: new Date().toISOString(),
		Amperage: parseDecimal(amperage) || 'N/A',
		Voltage: parseDecimal(voltage) || 'N/A',
		'Total energy': parseDecimal(totalEnergy)
			? `${parseDecimal(totalEnergy)} kJ`
			: 'N/A',
		Length: `${parseDecimal(length)} ${settings?.lengthImperial ? 'in' : 'mm'}`,
		Time: time ? `${toSeconds(time.toString())}s` : 'N/A',
		'Efficiency factor': parseDecimal(efficiencyFactor) || 'N/A',
		'Heat Input': `${calculatedResult} kJ/${settings?.resultUnit || 'mm'}`,
		'Travel Speed': travelSpeedFormatted,
		...customFieldsData,
	};

	return historyEntry;
}

export function useHistoryEntry() {
	return { createHistoryEntry };
}
