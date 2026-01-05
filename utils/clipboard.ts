import * as Clipboard from 'expo-clipboard';

/**
 * Copy a value to clipboard
 * @param value - The string to copy
 * @returns true if copied successfully, false if value was empty/invalid
 */
export async function copyToClipboard(value: string): Promise<boolean> {
	if (!value || value === '0' || value === '—') {
		return false;
	}

	await Clipboard.setStringAsync(value);

	return true;
}
