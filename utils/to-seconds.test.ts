import assert from 'node:assert';
import { describe, it } from 'node:test';
import { toSeconds } from './to-seconds.js';

describe('toSeconds', () => {
	it('should convert seconds only', () => {
		assert.strictEqual(toSeconds('45'), 45);
		assert.strictEqual(toSeconds('0'), 0);
		assert.strictEqual(toSeconds('120'), 120);
	});

	it('should convert minutes and seconds', () => {
		assert.strictEqual(toSeconds('2:30'), 150); // 2 * 60 + 30
		assert.strictEqual(toSeconds('1:00'), 60);
		assert.strictEqual(toSeconds('0:45'), 45);
		assert.strictEqual(toSeconds('10:05'), 605);
	});

	it('should convert hours, minutes, and seconds', () => {
		assert.strictEqual(toSeconds('1:30:45'), 5445); // 1 * 3600 + 30 * 60 + 45
		assert.strictEqual(toSeconds('2:00:00'), 7200); // 2 hours
		assert.strictEqual(toSeconds('0:05:30'), 330); // 5 minutes 30 seconds
		assert.strictEqual(toSeconds('12:34:56'), 45296);
	});

	it('should handle leading zeros', () => {
		assert.strictEqual(toSeconds('00:00:45'), 45);
		assert.strictEqual(toSeconds('01:02:03'), 3723);
		assert.strictEqual(toSeconds('00:30:00'), 1800);
	});

	it('should handle single digit values', () => {
		assert.strictEqual(toSeconds('1:2:3'), 3723); // 1 * 3600 + 2 * 60 + 3
		assert.strictEqual(toSeconds('5:0:0'), 18000);
	});
});


