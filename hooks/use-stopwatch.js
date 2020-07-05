import {useState, useEffect, useRef} from 'react';

export const useStopwatch = () => {
	const [started, setStarted] = useState(false);
	const [ms, setMs] = useState(0);

	const intervalRef = useRef();

	useEffect(() => {
		if (started) {
			const startTime = Date.now() - ms;
			const id = setInterval(() => {
				setMs(Date.now() - startTime);
			}, 1000);
			intervalRef.current = id;
		}

		return () => clearInterval(intervalRef.current);
	});
	return {
		ms,
		isRunning: started,
		start: () => setStarted(true),
		stop: () => setStarted(false),
		resetStopwatch: () => {
			setMs(0);
			setStarted(false);
		}
	};
};
