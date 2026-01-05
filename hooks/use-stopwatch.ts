import { useEffect, useRef, useState } from 'react';

interface UseStopwatchReturn {
	ms: number;
	isRunning: boolean;
	start: () => void;
	stop: () => void;
	resetStopwatch: () => void;
}

export const useStopwatch = (): UseStopwatchReturn => {
	const [started, setStarted] = useState<boolean>(false);
	const [startTime, setStartTime] = useState<number>(0);
	const [ms, setMs] = useState<number>(0);

	const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

	useEffect(() => {
		if (started && startTime > 0) {
			const id = setInterval(() => {
				setMs(Date.now() - startTime);
			}, 50);

			intervalRef.current = id;
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [started, startTime]);

	return {
		ms,
		isRunning: started,
		start: () => {
			setStartTime(Date.now());
			setStarted(true);
		},
		stop: () => setStarted(false),
		resetStopwatch: () => {
			setMs(0);
			setStarted(false);
		},
	};
};
