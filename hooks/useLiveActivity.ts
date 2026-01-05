import * as LiveActivity from 'expo-live-activity';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

interface UseLiveActivityProps {
	isRunning: boolean;
	accumulatedTime: number;
	timerUsed: boolean;
	formatTime: (ms: number) => string;
}

interface UseLiveActivityReturn {
	activityId: string | null;
	startActivity: (initialTime: number) => string | null;
	stopActivity: (finalTime: string) => void;
	startTimeRef: React.MutableRefObject<number | null>;
}

export function useLiveActivity({
	isRunning,
	accumulatedTime,
	timerUsed,
	formatTime,
}: UseLiveActivityProps): UseLiveActivityReturn {
	const [activityId, setActivityId] = useState<string | null>(null);
	const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const startTimeRef = useRef<number | null>(null);

	const startActivity = useCallback(
		(initialTime: number): string | null => {
			if (Platform.OS !== 'ios') return null;

			const id = LiveActivity.startActivity(
				{
					title: 'Heat Input',
					subtitle: formatTime(initialTime),
				},
				{
					backgroundColor: '#1c1c1e',
					titleColor: '#ffffff',
					subtitleColor: '#98989d',
					deepLinkUrl: '/(heat-input)',
				},
			);

			if (id) {
				setActivityId(id);
				startTimeRef.current = Date.now() - initialTime;
				return id;
			}

			return null;
		},
		[formatTime],
	);

	const stopActivity = useCallback(
		(finalTime: string) => {
			if (Platform.OS !== 'ios' || !activityId) return;

			try {
				LiveActivity.stopActivity(activityId, {
					title: 'Heat Input (Stopped)',
					subtitle: finalTime,
				});
			} catch {
				// Activity already dismissed - ignore
			}
			setActivityId(null);
		},
		[activityId],
	);

	useEffect(() => {
		if (Platform.OS === 'ios' && activityId && timerUsed) {
			if (updateIntervalRef.current) {
				clearInterval(updateIntervalRef.current);
			}

			if (isRunning && startTimeRef.current === null) {
				startTimeRef.current = Date.now() - accumulatedTime;
			} else if (!isRunning) {
				startTimeRef.current = null;
			}

			const updateLiveActivity = () => {
				let totalMs = accumulatedTime;

				if (isRunning && startTimeRef.current !== null) {
					totalMs = Date.now() - startTimeRef.current;
				}

				const formattedTime = formatTime(totalMs);
				const isPaused = !isRunning && accumulatedTime > 0;

				try {
					LiveActivity.updateActivity(activityId, {
						title: isPaused ? 'Heat Input (Paused)' : 'Heat Input',
						subtitle: formattedTime,
					});
				} catch {
					// Activity dismissed – will be cleaned up by listener
				}
			};

			updateLiveActivity();

			if (isRunning) {
				updateIntervalRef.current = setInterval(updateLiveActivity, 1000);
			}

			return () => {
				if (updateIntervalRef.current) {
					clearInterval(updateIntervalRef.current);
				}
			};
		}
		return undefined;
	}, [accumulatedTime, isRunning, timerUsed, activityId, formatTime]);

	useEffect(() => {
		if (Platform.OS !== 'ios') return;

		const subscription = LiveActivity.addActivityUpdatesListener((event) => {
			if (
				event.activityID === activityId &&
				(event.activityState === 'dismissed' || event.activityState === 'ended')
			) {
				setActivityId(null);
			}
		});

		return () => subscription?.remove();
	}, [activityId]);

	useEffect(() => {
		return () => {
			if (Platform.OS === 'ios' && activityId) {
				try {
					LiveActivity.stopActivity(activityId, {
						title: 'Heat Input (Stopped)',
						subtitle: '00:00:00',
					});
				} catch {
					// Already stopped
				}
			}
		};
	}, [activityId]);

	return {
		activityId,
		startActivity,
		stopActivity,
		startTimeRef,
	};
}
