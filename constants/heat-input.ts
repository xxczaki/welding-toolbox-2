export const EFFICIENCY_FACTOR_OPTIONS = [
	{ label: '0.6 – 141, 15', value: '0.6' },
	{ label: '0.8 – 111, 114, 131, 135, 136, 138', value: '0.8' },
	{ label: '1.0 – 121, 122, 125', value: '1.0' },
] as const;

export type EfficiencyFactorValue =
	(typeof EFFICIENCY_FACTOR_OPTIONS)[number]['value'];

export function getEfficiencyLabel(value: string): string {
	const option = EFFICIENCY_FACTOR_OPTIONS.find((o) => o.value === value);
	return option?.label || 'Select…';
}
