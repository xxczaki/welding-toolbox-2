/**
 * Parses a decimal string that may use comma or dot as decimal separator
 * @param value - String value (e.g., "1,5" or "1.5")
 * @returns Parsed number or 0 if invalid
 */
export function parseDecimal(value: string): number {
	const normalized = (value || '0').replace(/,/g, '.');
	const num = Number(normalized);

	return Number.isNaN(num) ? 0 : num;
}
