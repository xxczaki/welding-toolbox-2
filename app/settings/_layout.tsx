import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function SettingsLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
				animation: 'simple_push',
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
