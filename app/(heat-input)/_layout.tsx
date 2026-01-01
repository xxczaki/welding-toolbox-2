import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function HeatInputLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
				animation: 'simple_push',
				// Fix for white flash when opening/closing notification center on iOS
				// The react-native-screens library hardcodes a white background which doesn't respect dark mode
				// See: https://github.com/expo/expo/issues/39969
				contentStyle: { backgroundColor: '#000000' },
			}}
		>
			<Stack.Screen name="index" />
			<Stack.Screen
				name="history"
				options={{
					...Platform.select({
						ios: {
							// Disable swipe gesture on iOS to prevent white corners from showing during the gesture
							// This is a known issue with react-native-screens: https://github.com/expo/expo/issues/39969
							gestureEnabled: false,
						},
					}),
				}}
			/>
		</Stack>
	);
}
