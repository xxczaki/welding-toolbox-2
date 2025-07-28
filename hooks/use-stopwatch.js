import { useEffect, useRef, useState } from 'react';

export const useStopwatch = () => {
	const [started, setStarted] = useState(false);
	const [startTime, setStartTime] = useState(undefined);
	const [ms, setMs] = useState(0);

	const intervalRef = useRef();

	useEffect(() => {
		if (started) {
			const id = setInterval(() => {
				setMs(Date.now() - startTime);
			}, 50);

			intervalRef.current = id;
		}

		return () => clearTimeout(intervalRef.current);
	});

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
