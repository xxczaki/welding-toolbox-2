export const RESULT_UNIT_OPTIONS = [
	{ label: 'kJ/mm', value: 'mm' },
	{ label: 'kJ/cm', value: 'cm' },
	{ label: 'kJ/in', value: 'in' },
] as const;

export const TRAVEL_SPEED_UNIT_OPTIONS = [
	{ label: 'mm/min', value: 'mm/min' },
	{ label: 'mm/s', value: 'mm/s' },
	{ label: 'in/min', value: 'in/min' },
	{ label: 'in/s', value: 'in/s' },
] as const;

export type ResultUnitValue = (typeof RESULT_UNIT_OPTIONS)[number]['value'];
export type TravelSpeedUnitValue =
	(typeof TRAVEL_SPEED_UNIT_OPTIONS)[number]['value'];

export const getResultUnitLabels = () =>
	RESULT_UNIT_OPTIONS.map((o) => o.label);
export const getResultUnitValues = () =>
	RESULT_UNIT_OPTIONS.map((o) => o.value);

export const getTravelSpeedUnitLabels = () =>
	TRAVEL_SPEED_UNIT_OPTIONS.map((o) => o.label);
export const getTravelSpeedUnitValues = () =>
	TRAVEL_SPEED_UNIT_OPTIONS.map((o) => o.value);

export function getResultUnitLabel(value: string): string {
	const option = RESULT_UNIT_OPTIONS.find((o) => o.value === value);
	return option?.label || 'kJ/mm';
}

export function getTravelSpeedUnitLabel(value: string): string {
	const option = TRAVEL_SPEED_UNIT_OPTIONS.find((o) => o.value === value);
	return option?.label || 'mm/min';
}
