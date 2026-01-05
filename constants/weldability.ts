export type ElementKey =
	| 'carbon'
	| 'manganese'
	| 'silicon'
	| 'chromium'
	| 'nickel'
	| 'molybdenum'
	| 'copper'
	| 'vanadium'
	| 'nitrogen'
	| 'boron';

export const ELEMENT_KEYS: ElementKey[] = [
	'carbon',
	'manganese',
	'silicon',
	'chromium',
	'nickel',
	'molybdenum',
	'copper',
	'vanadium',
	'nitrogen',
	'boron',
];

export const INITIAL_ELEMENTS: Record<ElementKey, string> = {
	carbon: '',
	manganese: '',
	silicon: '',
	chromium: '',
	nickel: '',
	molybdenum: '',
	copper: '',
	vanadium: '',
	nitrogen: '',
	boron: '',
};

export const ELEMENT_LABELS: Record<
	ElementKey,
	{ name: string; symbol: string }
> = {
	carbon: { name: 'Carbon', symbol: 'C' },
	manganese: { name: 'Manganese', symbol: 'Mn' },
	silicon: { name: 'Silicon', symbol: 'Si' },
	chromium: { name: 'Chromium', symbol: 'Cr' },
	nickel: { name: 'Nickel', symbol: 'Ni' },
	molybdenum: { name: 'Molybdenum', symbol: 'Mo' },
	copper: { name: 'Copper', symbol: 'Cu' },
	vanadium: { name: 'Vanadium', symbol: 'V' },
	nitrogen: { name: 'Nitrogen', symbol: 'N' },
	boron: { name: 'Boron', symbol: 'B' },
};

// Keyboard navigation order (pairs of elements for two-column layout)
export const ELEMENT_INPUT_ORDER: ElementKey[] = [
	'carbon',
	'manganese',
	'silicon',
	'chromium',
	'nickel',
	'molybdenum',
	'copper',
	'vanadium',
	'nitrogen',
	'boron',
];
