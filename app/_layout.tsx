import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
	Icon,
	Label,
	NativeTabs,
	VectorIcon,
} from 'expo-router/unstable-native-tabs';
import { setBackgroundColorAsync } from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeStorage } from '../storage';

export default function TabLayout() {
	useEffect(() => {
		// Set the system UI background color to match the app theme
		setBackgroundColorAsync('#000000');

		// Initialize storage with defaults if needed
		initializeStorage();
	}, []);

	return (
		<SafeAreaProvider>
			<NativeTabs
				minimizeBehavior="onScrollDown"
				tintColor="#ff9800"
				backgroundColor="#121212"
				indicatorColor="#ff9800"
				iconColor={{
					default: '#888888',
					selected: Platform.select({
						ios: '#ff9800',
						android: '#121212',
					}),
				}}
			>
				<NativeTabs.Trigger name="(heat-input)">
					<Label>Heat Input</Label>
					{Platform.select({
						ios: <Icon sf="flame.fill" />,
						android: (
							<Icon
								src={<VectorIcon family={MaterialCommunityIcons} name="fire" />}
							/>
						),
					})}
				</NativeTabs.Trigger>
				<NativeTabs.Trigger name="weldability">
					<Label>Weldability</Label>
					{Platform.select({
						ios: <Icon sf="function" />,
						android: (
							<Icon
								src={
									<VectorIcon
										family={MaterialCommunityIcons}
										name="calculator"
									/>
								}
							/>
						),
					})}
				</NativeTabs.Trigger>
				<NativeTabs.Trigger name="settings">
					<Label>Settings</Label>
					{Platform.select({
						ios: <Icon sf="gearshape.fill" />,
						android: (
							<Icon
								src={
									<VectorIcon
										family={MaterialCommunityIcons}
										name="cog-outline"
									/>
								}
							/>
						),
					})}
				</NativeTabs.Trigger>
			</NativeTabs>
		</SafeAreaProvider>
	);
}
