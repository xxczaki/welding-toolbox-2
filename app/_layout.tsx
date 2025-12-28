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
import { isIPad } from '../utils/platform';

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
				backgroundColor={isIPad() ? '#1c1c1e' : '#121212'}
				indicatorColor="#ff9800"
				iconColor={{
					default: '#888888',
					selected: Platform.OS === 'android' ? '#1e1e1e' : '#ff9800',
				}}
			>
				<NativeTabs.Trigger name="(heat-input)">
					<Label>Heat Input</Label>
					{Platform.OS === 'ios' ? (
						<Icon sf="flame.fill" />
					) : (
						<Icon
							src={<VectorIcon family={MaterialCommunityIcons} name="fire" />}
						/>
					)}
				</NativeTabs.Trigger>
				<NativeTabs.Trigger name="weldability">
					<Label>Weldability</Label>
					{Platform.OS === 'ios' ? (
						<Icon sf="function" />
					) : (
						<Icon
							src={
								<VectorIcon family={MaterialCommunityIcons} name="calculator" />
							}
						/>
					)}
				</NativeTabs.Trigger>
				<NativeTabs.Trigger name="settings">
					<Label>Settings</Label>
					{Platform.OS === 'ios' ? (
						<Icon sf="gearshape.fill" />
					) : (
						<Icon
							src={
								<VectorIcon
									family={MaterialCommunityIcons}
									name="cog-outline"
								/>
							}
						/>
					)}
				</NativeTabs.Trigger>
			</NativeTabs>
		</SafeAreaProvider>
	);
}
