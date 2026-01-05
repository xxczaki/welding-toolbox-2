import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import ARKitMeasurement from 'react-native-arkit-measurement';
import { round } from '../utils/round';

interface UseARMeasurementProps {
	unit: 'mm' | 'in';
	onMeasurement: (distance: string) => void;
}

interface UseARMeasurementReturn {
	isSupported: boolean;
	measure: () => Promise<void>;
}

export function useARMeasurement({
	unit,
	onMeasurement,
}: UseARMeasurementProps): UseARMeasurementReturn {
	const [isSupported, setIsSupported] = useState<boolean>(false);

	useEffect(() => {
		if (Platform.OS === 'ios') {
			ARKitMeasurement.isSupported()
				.then(setIsSupported)
				.catch(() => {
					setIsSupported(false);
				});
		}
	}, []);

	const measure = useCallback(async () => {
		try {
			const result = await ARKitMeasurement.measureDistance({ unit });

			const formattedDistance = round(result.distance).toString();

			onMeasurement(formattedDistance);
		} catch (error) {
			const errorCode = (error as { code?: string })?.code;
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';

			if (
				errorCode !== 'USER_CANCELLED' &&
				!errorMessage.includes('cancelled')
			) {
				Alert.alert('AR Measurement Error', errorMessage);
			}
		}
	}, [unit, onMeasurement]);

	return {
		isSupported,
		measure,
	};
}
