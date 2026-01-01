import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export type MeasurementUnit = 'mm' | 'in';

export interface MeasurementOptions {
	/** Unit to display and return measurements in. Defaults to 'mm'. */
	unit?: MeasurementUnit;
}

export interface MeasurementResult {
	/** Total distance measured (sum of all segments if multi-point) */
	distance: number;
	/** Unit of measurement */
	unit: MeasurementUnit;
	/** Individual segment distances (for multi-point measurements) */
	segments?: number[];
}

interface ARKitMeasurementModuleType {
	measureDistance(options?: MeasurementOptions): Promise<MeasurementResult>;
	isSupported(): Promise<boolean>;
}

const NativeModule =
	Platform.OS === 'ios'
		? requireNativeModule<ARKitMeasurementModuleType>('ARKitMeasurementModule')
		: null;

const ARKitMeasurementModule: ARKitMeasurementModuleType = {
	measureDistance: (options?: MeasurementOptions) => {
		if (!NativeModule) {
			return Promise.reject(new Error('ARKit is only available on iOS'));
		}
		return NativeModule.measureDistance(options ?? { unit: 'mm' });
	},
	isSupported: () => {
		if (!NativeModule) {
			return Promise.resolve(false);
		}
		return NativeModule.isSupported();
	},
};

export default ARKitMeasurementModule;
