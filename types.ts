// Shared type definitions for the application

export interface CustomField {
	name: string;
	unit: string;
	timestamp: number;
}

export interface ExportField {
	id: string;
	label: string;
	type: 'default' | 'custom';
	// For custom fields, links to CustomField.timestamp
	customFieldTimestamp?: number;
}

// Default export fields in their default order
export const DEFAULT_EXPORT_FIELDS: ExportField[] = [
	{ id: 'date', label: 'Date', type: 'default' },
	{ id: 'heatInput', label: 'Heat Input', type: 'default' },
	{ id: 'voltage', label: 'Voltage', type: 'default' },
	{ id: 'amperage', label: 'Amperage', type: 'default' },
	{ id: 'totalEnergy', label: 'Total Energy', type: 'default' },
	{ id: 'length', label: 'Length', type: 'default' },
	{ id: 'time', label: 'Time', type: 'default' },
	{ id: 'efficiency', label: 'Efficiency Factor', type: 'default' },
	{ id: 'travelSpeed', label: 'Travel Speed', type: 'default' },
];

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
	// Export field order – includes both default and custom fields
	exportFieldOrder?: ExportField[];
}

export const DEFAULT_SETTINGS: Settings = {
	resultUnit: 'mm',
	lengthImperial: false,
	totalEnergy: false,
	resultHistory: [],
	customFields: [],
	travelSpeedUnit: 'mm/min',
};
