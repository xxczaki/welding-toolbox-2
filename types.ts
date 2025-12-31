// Shared type definitions for the application

export interface CustomField {
	name: string;
	unit: string;
	timestamp: number;
}

export interface HistoryEntry {
	id: string;
	Date: string;
	Amperage: number | string;
	Voltage: number | string;
	'Total energy': string;
	Length: string;
	Time: string;
	'Efficiency factor': number | string;
	'Heat Input': string;
	'Travel Speed': string;
	[key: string]: string | number; // For custom fields
}

export interface Settings {
	resultUnit?: 'mm' | 'cm' | 'in';
	lengthImperial?: boolean;
	totalEnergy?: boolean;
	customFields?: CustomField[];
	resultHistory?: HistoryEntry[];
	travelSpeedUnit?: 'mm/min' | 'mm/s' | 'in/min' | 'in/s';
}

export const DEFAULT_SETTINGS: Settings = {
	resultUnit: 'mm',
	lengthImperial: false,
	totalEnergy: false,
	resultHistory: [],
	customFields: [],
	travelSpeedUnit: 'mm/min',
};
