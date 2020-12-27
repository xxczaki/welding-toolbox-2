import {useState, useEffect, useRef} from 'react';

export const useStopwatch = () => {
	const [started, setStarted] = useState(false);
	const [ms, setMs] = useState(1000);

	const timeoutRef = useRef();
	const deltaRef = useRef();

	useEffect(() => {
		if (started) {
			const id = setTimeout(step, 1000);

			// eslint-disable-next-line no-inner-declarations
			function step() {
				const drift = Date.now() - ms;

				setMs(ms + 1000);
				const id = setTimeout(step, Math.max(0, 1000 - drift));
				deltaRef.current = id;
			}

			timeoutRef.current = id;
		}

		return () => {
			clearTimeout(timeoutRef.current);
			clearTimeout(deltaRef.current);
		};
	});
	return {
		ms,
		isRunning: started,
		start: () => setStarted(true),
		stop: () => setStarted(false),
		resetStopwatch: () => {
			setMs(1000);
			setStarted(false);
		}
	};
};
