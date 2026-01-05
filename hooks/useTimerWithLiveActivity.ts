import { useCallback, useEffect, useState } from 'react';
import { useStopwatch } from './use-stopwatch';
import { useLiveActivity } from './useLiveActivity';

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

	const { activityId, startActivity, stopActivity, startTimeRef } =
		useLiveActivity({
			isRunning,
			accumulatedTime,
			timerUsed,
			formatTime,
		});

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
			if (startTimeRef.current !== null) {
				const currentElapsed = Date.now() - startTimeRef.current;

				setAccumulatedTime(currentElapsed);
			} else {
				setAccumulatedTime((prev) => prev + ms);
			}

			stop();
			resetStopwatch();

			startTimeRef.current = null;
		} else {
			start();
			setIsStopped(false);
			setTimerUsed(true);

			if (!activityId) {
				startActivity(accumulatedTime);
			} else {
				startTimeRef.current = Date.now() - accumulatedTime;
			}
		}
	}, [
		isRunning,
		ms,
		stop,
		resetStopwatch,
		start,
		activityId,
		accumulatedTime,
		startActivity,
		startTimeRef,
	]);

	const handleStopTimer = useCallback(() => {
		const finalTime = formatTime(accumulatedTime);
		stop();
		resetStopwatch();
		setAccumulatedTime(0);
		setIsStopped(true);
		setTimerUsed(false);

		stopActivity(finalTime);
	}, [accumulatedTime, formatTime, stop, resetStopwatch, stopActivity]);

	const handleTimeChange = useCallback(
		(value: string) => {
			setTime(value);
			if (timerUsed || isRunning) {
				const finalTime = formatTime(accumulatedTime);
				stop();
				resetStopwatch();
				setAccumulatedTime(0);
				setIsStopped(true);
				setTimerUsed(false);

				stopActivity(finalTime);
			}
		},
		[
			timerUsed,
			isRunning,
			formatTime,
			accumulatedTime,
			stop,
			resetStopwatch,
			stopActivity,
		],
	);

	const resetTimer = useCallback(() => {
		const finalTime = formatTime(accumulatedTime);
		setTime('');
		resetStopwatch();
		setAccumulatedTime(0);
		setIsStopped(false);
		setTimerUsed(false);

		stopActivity(finalTime);
	}, [accumulatedTime, formatTime, resetStopwatch, stopActivity]);

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
