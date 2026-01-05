import { useMemo } from 'react';
import { ceAws, ceq, cet, pcm, pren } from 'welding-utils';

import type { ElementKey } from '../constants/weldability';
import { parseDecimal } from '../utils/parse-decimal';
import { round } from '../utils/round';

export interface UseWeldabilityCalculationsProps {
	elements: Record<ElementKey, string>;
}

export interface WeldabilityResult {
	label: string;
	value: string;
}

export interface UseWeldabilityCalculationsReturn {
	ceqResult: string;
	cetResult: string;
	ceAwsResult: string;
	pcmResult: string;
	prenResult: string;
	resultChips: WeldabilityResult[];
	hasAnyResult: boolean;
}

export function useWeldabilityCalculations({
	elements,
}: UseWeldabilityCalculationsProps): UseWeldabilityCalculationsReturn {
	const ceqResult = useMemo(() => {
		if (!elements.carbon) return '0';
		const ceqData = {
			carbon: parseDecimal(elements.carbon),
			manganese: parseDecimal(elements.manganese),
			chromium: parseDecimal(elements.chromium),
			molybdenum: parseDecimal(elements.molybdenum),
			vanadium: parseDecimal(elements.vanadium),
			nickel: parseDecimal(elements.nickel),
			copper: parseDecimal(elements.copper),
		};

		const ceqValue = round(ceq(ceqData));

		return Number.isNaN(ceqValue) ? '0' : ceqValue.toString();
	}, [elements]);

	const cetResult = useMemo(() => {
		if (!elements.carbon) return '0';

		const cetData = {
			carbon: parseDecimal(elements.carbon),
			manganese: parseDecimal(elements.manganese),
			chromium: parseDecimal(elements.chromium),
			molybdenum: parseDecimal(elements.molybdenum),
			vanadium: parseDecimal(elements.vanadium),
			nickel: parseDecimal(elements.nickel),
			copper: parseDecimal(elements.copper),
		};

		const cetValue = round(cet(cetData));

		return Number.isNaN(cetValue) ? '0' : cetValue.toString();
	}, [elements]);

	const ceAwsResult = useMemo(() => {
		if (!elements.carbon) return '0';

		const ceAwsData = {
			silicon: parseDecimal(elements.silicon),
			carbon: parseDecimal(elements.carbon),
			manganese: parseDecimal(elements.manganese),
			chromium: parseDecimal(elements.chromium),
			molybdenum: parseDecimal(elements.molybdenum),
			vanadium: parseDecimal(elements.vanadium),
			nickel: parseDecimal(elements.nickel),
			copper: parseDecimal(elements.copper),
		};

		const ceAwsValue = round(ceAws(ceAwsData));

		return Number.isNaN(ceAwsValue) ? '0' : ceAwsValue.toString();
	}, [elements]);

	const pcmResult = useMemo(() => {
		if (!elements.carbon) return '0';

		const pcmData = {
			silicon: parseDecimal(elements.silicon),
			boron: parseDecimal(elements.boron),
			carbon: parseDecimal(elements.carbon),
			manganese: parseDecimal(elements.manganese),
			chromium: parseDecimal(elements.chromium),
			molybdenum: parseDecimal(elements.molybdenum),
			vanadium: parseDecimal(elements.vanadium),
			nickel: parseDecimal(elements.nickel),
			copper: parseDecimal(elements.copper),
		};

		const pcmValue = round(pcm(pcmData));

		return Number.isNaN(pcmValue) ? '0' : pcmValue.toString();
	}, [elements]);

	const prenResult = useMemo(() => {
		if (!elements.chromium && !elements.molybdenum && !elements.nitrogen)
			return '0';

		const prenData = {
			nitrogen: parseDecimal(elements.nitrogen),
			chromium: parseDecimal(elements.chromium),
			molybdenum: parseDecimal(elements.molybdenum),
		};

		const prenValue = round(pren(prenData));

		return Number.isNaN(prenValue) ? '0' : prenValue.toString();
	}, [elements]);

	const resultChips: WeldabilityResult[] = useMemo(
		() => [
			{ label: 'CEQ', value: ceqResult },
			{ label: 'CET', value: cetResult },
			{ label: 'CE AWS', value: ceAwsResult },
			{ label: 'PCM', value: pcmResult },
			{ label: 'PREN', value: prenResult },
		],
		[ceqResult, cetResult, ceAwsResult, pcmResult, prenResult],
	);

	const hasAnyResult = useMemo(
		() =>
			ceqResult !== '0' ||
			cetResult !== '0' ||
			ceAwsResult !== '0' ||
			pcmResult !== '0' ||
			prenResult !== '0',
		[ceqResult, cetResult, ceAwsResult, pcmResult, prenResult],
	);

	return {
		ceqResult,
		cetResult,
		ceAwsResult,
		pcmResult,
		prenResult,
		resultChips,
		hasAnyResult,
	};
}
