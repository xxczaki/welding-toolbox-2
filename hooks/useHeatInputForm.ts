import { useCallback, useMemo, useState } from 'react';

import type { HistoryEntry, Settings } from '../types';
import { createHistoryEntry } from './useHistoryEntry';

export interface UseHeatInputFormProps {
	settings: Settings;
	updateSettings: (updates: Partial<Settings>) => void;
	calculatedResult: number;
	calculatedTravelSpeed: number;
	time: string;
	resetTimer: () => void;
}

export interface UseHeatInputFormReturn {
	// Form state
	amperage: string;
	setAmperage: (value: string) => void;
	voltage: string;
	setVoltage: (value: string) => void;
	length: string;
	setLength: (value: string) => void;
	totalEnergy: string;
	setTotalEnergy: (value: string) => void;
	efficiencyFactor: string;
	setEfficiencyFactor: (value: string) => void;
	isDiameter: boolean;
	setDiameter: (value: boolean) => void;
	customFieldValues: Record<string, string>;
	setCustomFieldValue: (name: string, value: string) => void;
	setCustomFieldValues: React.Dispatch<
		React.SetStateAction<Record<string, string>>
	>;

	// Computed
	hasInputs: boolean;
	lengthUnit: 'mm' | 'in';

	// Actions
	resetForm: () => void;
	saveToHistory: () => { success: boolean; entry?: HistoryEntry };
}

export function useHeatInputForm({
	settings,
	updateSettings,
	calculatedResult,
	calculatedTravelSpeed,
	time,
	resetTimer,
}: UseHeatInputFormProps): UseHeatInputFormReturn {
	// Form state
	const [amperage, setAmperage] = useState('');
	const [voltage, setVoltage] = useState('');
	const [length, setLength] = useState('');
	const [totalEnergy, setTotalEnergy] = useState('');
	const [efficiencyFactor, setEfficiencyFactor] = useState('');
	const [isDiameter, setDiameter] = useState(false);
	const [customFieldValues, setCustomFieldValues] = useState<
		Record<string, string>
	>({});

	const setCustomFieldValue = useCallback((name: string, value: string) => {
		setCustomFieldValues((prev) => ({ ...prev, [name]: value }));
	}, []);

	const lengthUnit = settings?.lengthImperial ? 'in' : 'mm';

	const hasInputs = useMemo(
		() =>
			Boolean(
				amperage ||
					voltage ||
					length ||
					totalEnergy ||
					efficiencyFactor ||
					time ||
					Object.values(customFieldValues).some((v) => v),
			),
		[
			amperage,
			voltage,
			length,
			totalEnergy,
			efficiencyFactor,
			time,
			customFieldValues,
		],
	);

	const resetForm = useCallback(() => {
		setAmperage('');
		setVoltage('');
		setLength('');
		setTotalEnergy('');
		setEfficiencyFactor('');
		setDiameter(false);
		setCustomFieldValues({});
		resetTimer();
	}, [resetTimer]);

	const saveToHistory = useCallback((): {
		success: boolean;
		entry?: HistoryEntry;
	} => {
		const entry = createHistoryEntry({
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
		});

		if (!entry) {
			return { success: false };
		}

		updateSettings({
			resultHistory: [entry, ...(settings?.resultHistory || [])],
		});

		return { success: true, entry };
	}, [
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
		updateSettings,
	]);

	return {
		// Form state
		amperage,
		setAmperage,
		voltage,
		setVoltage,
		length,
		setLength,
		totalEnergy,
		setTotalEnergy,
		efficiencyFactor,
		setEfficiencyFactor,
		isDiameter,
		setDiameter,
		customFieldValues,
		setCustomFieldValue,
		setCustomFieldValues,

		// Computed
		hasInputs,
		lengthUnit,

		// Actions
		resetForm,
		saveToHistory,
	};
}
