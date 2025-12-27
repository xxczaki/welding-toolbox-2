export interface HeatInputOptions {
	voltage: number;
	amperage: number;
	efficiencyFactor: number;
	length: number;
	time: number;
}

export interface Elements {
	carbon: number;
	manganese: number;
	chromium: number;
	molybdenum: number;
	vanadium: number;
	nickel: number;
	copper: number;
	silicon: number;
	boron: number;
	nitrogen: number;
}

export interface PreheatOptions {
	cet: number;
	thickness: number;
	heatInput: number;
	hydrogenLevel: number;
}

export type CeqElements = Omit<Elements, 'silicon' | 'boron' | 'nitrogen'>;
export type CetElements = Omit<Elements, 'silicon' | 'boron' | 'nitrogen'>;
export type CeAwsElements = Omit<Elements, 'boron' | 'nitrogen'>;
export type PcmElements = Omit<Elements, 'nitrogen'>;
export type PrenElements = Pick<
	Elements,
	'chromium' | 'molybdenum' | 'nitrogen'
>;

/**
 * Calculate equivalent carbon content (CEQ)
 * @param elements - Chemical elements composition
 * @returns Equivalent carbon content (CEQ)
 */
export function ceq(elements: CeqElements): number {
	const { carbon, manganese, chromium, molybdenum, vanadium, nickel, copper } =
		elements;

	return (
		carbon +
		manganese / 6 +
		(chromium + molybdenum + vanadium) / 5 +
		(nickel + copper) / 15
	);
}

/**
 * Calculate equivalent carbon content (CET)
 * @param elements - Chemical elements composition
 * @returns Equivalent carbon content (CET)
 */
export function cet(elements: CetElements): number {
	const { carbon, manganese, chromium, molybdenum, nickel, copper } = elements;

	return (
		carbon +
		(manganese + molybdenum) / 10 +
		(chromium + copper) / 20 +
		nickel / 40
	);
}

/**
 * Calculate equivalent carbon content (CE AWS)
 * @param elements - Chemical elements composition
 * @returns Equivalent carbon content (CE AWS)
 */
export function ceAws(elements: CeAwsElements): number {
	const {
		carbon,
		manganese,
		chromium,
		molybdenum,
		vanadium,
		nickel,
		copper,
		silicon,
	} = elements;

	return (
		carbon +
		manganese / 6 +
		(chromium + molybdenum + vanadium) / 5 +
		(nickel + copper) / 15 +
		silicon / 6
	);
}

/**
 * Calculate critical metal parameter (PCM)
 * @param elements - Chemical elements composition
 * @returns Critical metal parameter (PCM)
 */
export function pcm(elements: PcmElements): number {
	const {
		carbon,
		manganese,
		chromium,
		molybdenum,
		vanadium,
		nickel,
		copper,
		silicon,
		boron,
	} = elements;

	return (
		carbon +
		silicon / 30 +
		(manganese + copper + chromium) / 20 +
		nickel / 60 +
		molybdenum / 15 +
		vanadium / 10 +
		5 * boron
	);
}

/**
 * Calculate pitting resistance equivalent number (PREN)
 * @param elements - Chemical elements composition
 * @returns Pitting resistance equivalent number (PREN)
 */
export function pren(elements: PrenElements): number {
	const { chromium, molybdenum, nitrogen } = elements;

	return chromium + 3.3 * molybdenum + 16 * nitrogen;
}

/**
 * Calculate heat input
 * @param options - Heat input calculation options
 * @returns Heat input value
 */
export function heatInput(options: HeatInputOptions): number {
	const { voltage, amperage, efficiencyFactor, length, time } = options;

	return (voltage * amperage * efficiencyFactor) / ((length / time) * 1000);
}

/**
 * Calculate preheat temperature
 * @param options - Preheat calculation options
 * @returns Preheat temperature value
 */
export function preheat(options: PreheatOptions): number {
	const { cet, thickness, heatInput, hydrogenLevel } = options;

	return (
		697 * cet +
		160 * Math.tanh(thickness / 35) +
		62 * (hydrogenLevel * 0.35) +
		(53 * cet - 32) * heatInput -
		328
	);
}
