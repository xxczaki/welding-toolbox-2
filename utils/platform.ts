import type { Platform as PlatformType } from 'react-native';
import { Platform } from 'react-native';

export const isIPad = (): boolean => {
	if (Platform.OS !== 'ios') {
		return false;
	}

	return (Platform as Extract<PlatformType, { OS: 'ios' }>).isPad;
};
