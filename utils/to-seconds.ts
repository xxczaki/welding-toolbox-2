/**
 * Converts a time string in HH:MM:SS format to seconds
 * @param timeString - Time string (e.g., "1:30:45", "45", "2:30")
 * @returns Total seconds
 * @example
 * toSeconds('1:30:45') // 5445 seconds
 * toSeconds('2:30') // 150 seconds
 * toSeconds('45') // 45 seconds
 */
export function toSeconds(timeString: string): number {
	const parts = timeString.split(':');
    
	let seconds = 0;
	let minutes = 1;

	while (parts.length > 0) {
		const part = parts.pop();

		if (part !== undefined) {
			seconds += minutes * Number.parseInt(part, 10);
			minutes *= 60;
		}
	}

	return seconds;
}
