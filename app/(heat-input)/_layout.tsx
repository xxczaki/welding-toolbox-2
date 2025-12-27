import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function HeatInputLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
				animation: 'simple_push',
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
