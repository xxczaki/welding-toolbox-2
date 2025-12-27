import assert from 'node:assert';
import { describe, it } from 'node:test';
import { ceAws, ceq, cet, heatInput, pcm, preheat, pren } from './index.js';

const elements = {
	carbon: 1,
	manganese: 1.3,
	chromium: 0.4,
	molybdenum: 2,
	vanadium: 2.1,
	nickel: 0.8,
	copper: 1.1,
	silicon: 2.8,
	boron: 3,
	nitrogen: 0.03,
};

describe('welding-utils', () => {
	it('should calculate ceq correctly', () => {
		assert.strictEqual(ceq(elements), 2.243333333333333);
	});

	it('should calculate cet correctly', () => {
		assert.strictEqual(cet(elements), 1.425);
	});

	it('should calculate ceAws correctly', () => {
		assert.strictEqual(ceAws(elements), 2.71);
	});

	it('should calculate pcm correctly', () => {
		assert.strictEqual(pcm(elements), 16.59);
	});

	it('should calculate pren correctly', () => {
		assert.strictEqual(pren(elements), 7.48);
	});

	it('should calculate heatInput correctly', () => {
		const options = {
			voltage: 200,
			amperage: 32,
			efficiencyFactor: 0.8,
			length: 20,
			time: 11,
		};

		assert.strictEqual(heatInput(options), 2.8160000000000003);
	});

	it('should calculate preheat correctly', () => {
		const options = {
			cet: 0.4,
			thickness: 10,
			heatInput: 4,
			hydrogenLevel: 5,
		};

		assert.strictEqual(preheat(options), 60.609678452112405);
	});
});
