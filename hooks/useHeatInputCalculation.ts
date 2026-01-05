import { useMemo } from 'react';
import { heatInput } from 'welding-utils';
import type { Settings } from '../types';
import { parseDecimal } from '../utils/parse-decimal';
import { round } from '../utils/round';
import { toSeconds } from '../utils/to-seconds';

interface UseHeatInputCalculationProps {
	amperage: string;
	voltage: string;
	length: string;
	time: string;
	efficiencyFactor: string;
	totalEnergy: string;
	isDiameter: boolean;
	settings: Settings;
}

interface UseHeatInputCalculationReturn {
	calculatedResult: number;
	calculatedTravelSpeed: number;
}

export function useHeatInputCalculation({
	amperage,
	voltage,
	length,
	time,
	efficiencyFactor,
	totalEnergy,
	isDiameter,
	settings,
}: UseHeatInputCalculationProps): UseHeatInputCalculationReturn {
	const calculatedTravelSpeed = useMemo(() => {
		// Travel speed can't be calculated in total energy mode (no time input)
		if (!length || !time || settings?.totalEnergy) {
			return 0;
		}

		try {
			let calculatedLength = parseDecimal(length);
			const timeInSeconds = toSeconds(time.toString());

			if (timeInSeconds === 0) {
				return 0;
			}

			if (isDiameter) {
				calculatedLength = round(calculatedLength * Math.PI);
			}

			let speed = calculatedLength / timeInSeconds;

			const unit = settings?.travelSpeedUnit || 'mm/min';

			if (unit.endsWith('/min')) {
				speed *= 60; // Convert to per minute
			}

			if (Number.isNaN(speed)) {
				return 0;
			}

			return round(speed);
		} catch {
			return 0;
		}
	}, [
		length,
		time,
		isDiameter,
		settings?.travelSpeedUnit,
		settings?.totalEnergy,
	]);

	const calculatedResult = useMemo(() => {
		const hasTotalEnergyInputs = totalEnergy && length;
		const hasFullInputs =
			amperage && voltage && length && time && efficiencyFactor;

		if (!hasTotalEnergyInputs && !hasFullInputs) {
			return 0;
		}

		try {
			let calculatedLength = parseDecimal(length);

			// Convert imperial to metric if needed
			if (settings?.lengthImperial && settings?.resultUnit !== 'in') {
				calculatedLength *= 25.4;
			}

			let result: number;

			if (settings?.totalEnergy && totalEnergy && length) {
				const energy = parseDecimal(totalEnergy);

				result = energy / calculatedLength;
			} else if (hasFullInputs) {
				const amp = parseDecimal(amperage);
				const volt = parseDecimal(voltage);
				const timeInSeconds = toSeconds(time.toString());
				const efficiency = parseDecimal(efficiencyFactor);

				if (isDiameter) {
					calculatedLength = round(calculatedLength * Math.PI);
				}

				result = heatInput({
					amperage: amp,
					voltage: volt,
					length: calculatedLength,
					time: timeInSeconds,
					efficiencyFactor: efficiency,
				});
			} else {
				return 0;
			}

			if (settings?.resultUnit === 'cm') {
				result *= 10;
			} else if (settings?.resultUnit === 'in' && !settings?.lengthImperial) {
				result *= 25.4;
			}

			if (Number.isNaN(result)) {
				return 0;
			}

			return round(result);
		} catch {
			return 0;
		}
	}, [
		amperage,
		voltage,
		length,
		time,
		efficiencyFactor,
		totalEnergy,
		isDiameter,
		settings?.lengthImperial,
		settings?.resultUnit,
		settings?.totalEnergy,
	]);

	return {
		calculatedResult,
		calculatedTravelSpeed,
	};
}
