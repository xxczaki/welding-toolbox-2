/**
 * Rounds a number to specified decimal places
 * @param value - The number to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded number
 */
export function round(value: number, decimals = 2): number {
	const factor = 10 ** decimals;
	return Math.round((value + Number.EPSILON) * factor) / factor;
}
