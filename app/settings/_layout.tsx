import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function SettingsLayout() {
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
				name="custom-fields"
				options={{
					...Platform.select({
						ios: {
							gestureEnabled: false,
						},
					}),
				}}
			/>
		</Stack>
	);
}
