import { useCallback, useEffect, useState } from 'react';
import { useStopwatch } from './use-stopwatch';

interface UseTimerWithLiveActivityReturn {
	time: string;
	setTime: (value: string) => void;
	isRunning: boolean;
	isStopped: boolean;
	timerUsed: boolean;
	hasTimerValue: boolean;
	accumulatedTime: number;
	handleStartStop: () => void;
	handleStopTimer: () => void;
	handleTimeChange: (value: string) => void;
	resetTimer: () => void;
	formatTime: (ms: number) => string;
}

export function useTimerWithLiveActivity(): UseTimerWithLiveActivityReturn {
	const [time, setTime] = useState<string>('');
	const [accumulatedTime, setAccumulatedTime] = useState<number>(0);
	const [isStopped, setIsStopped] = useState<boolean>(false);
	const [timerUsed, setTimerUsed] = useState<boolean>(false);

	const { ms, start, stop, resetStopwatch, isRunning } = useStopwatch();

	const formatTime = useCallback((totalMs: number): string => {
		return new Date(totalMs).toISOString().slice(11, -5);
	}, []);

	useEffect(() => {
		if (isRunning) {
			const totalMs = ms + accumulatedTime;
			setTime(formatTime(totalMs));
		}
	}, [isRunning, ms, accumulatedTime, formatTime]);

	const hasTimerValue =
		timerUsed && !!time && time !== '00:00:00' && !isStopped;

	const handleStartStop = useCallback(() => {
		if (isRunning) {
			setAccumulatedTime((prev) => prev + ms);
			stop();
			resetStopwatch();
		} else {
			start();
			setIsStopped(false);
			setTimerUsed(true);
		}
	}, [isRunning, ms, stop, resetStopwatch, start]);

	const handleStopTimer = useCallback(() => {
		stop();
		resetStopwatch();
		setAccumulatedTime(0);
		setIsStopped(true);
		setTimerUsed(false);
	}, [stop, resetStopwatch]);

	const handleTimeChange = useCallback(
		(value: string) => {
			setTime(value);
			if (timerUsed || isRunning) {
				stop();
				resetStopwatch();
				setAccumulatedTime(0);
				setIsStopped(true);
				setTimerUsed(false);
			}
		},
		[timerUsed, isRunning, stop, resetStopwatch],
	);

	const resetTimer = useCallback(() => {
		setTime('');
		resetStopwatch();
		setAccumulatedTime(0);
		setIsStopped(false);
		setTimerUsed(false);
	}, [resetStopwatch]);

	return {
		time,
		setTime,
		isRunning,
		isStopped,
		timerUsed,
		hasTimerValue,
		accumulatedTime,
		handleStartStop,
		handleStopTimer,
		handleTimeChange,
		resetTimer,
		formatTime,
	};
}
