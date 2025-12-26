import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { setBackgroundColorAsync } from 'expo-system-ui';
import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { MD3DarkTheme, Provider as PaperProvider } from 'react-native-paper';
import {
	SafeAreaProvider,
	useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HeatInputScreen from './screens/HeatInputScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import WeldabilityScreen from './screens/WeldabilityScreen';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const theme = {
	...MD3DarkTheme,
	colors: {
		...MD3DarkTheme.colors,
		primary: '#ff9800',
		accent: '#c66900',
	},
};

const Stack = createNativeStackNavigator();

const HeatInputStack = () => (
	<Stack.Navigator
		initialRouteName="Home"
		screenOptions={{ headerShown: false }}
	>
		<Stack.Screen name="Home" component={HeatInputScreen} />
		<Stack.Screen name="History" component={HistoryScreen} />
	</Stack.Navigator>
);

const Tab = createMaterialTopTabNavigator();

const AppContent = () => {
	const insets = useSafeAreaInsets();

	return (
		<NavigationContainer>
			<PaperProvider theme={theme}>
				<StatusBar backgroundColor="#212121" barStyle="light-content" />
				<Tab.Navigator
					initialRouteName="HeatInput"
					tabBarPosition="bottom"
					screenOptions={{
						tabBarStyle: {
							backgroundColor: '#272727',
							paddingBottom: insets.bottom,
						},
						tabBarLabelStyle: { textTransform: 'none' },
						tabBarIndicator: () => null,
					}}
				>
					<Tab.Screen
						name="HeatInput"
						options={{
							tabBarLabel: 'Heat Input',
							tabBarIcon: ({ color }) => (
								<Icon name="fire" color={color} size={26} />
							),
							tabBarActiveTintColor: '#ff9800',
							tabBarInactiveTintColor: '#616161',
						}}
						component={HeatInputStack}
					/>
					<Tab.Screen
						name="Weldability"
						options={{
							tabBarIcon: ({ color }) => (
								<Icon name="calculator" color={color} size={26} />
							),
							tabBarActiveTintColor: '#ff9800',
							tabBarInactiveTintColor: '#616161',
						}}
						component={WeldabilityScreen}
					/>
					<Tab.Screen
						name="Settings"
						options={{
							tabBarIcon: ({ color }) => (
								<Icon name="cog-outline" color={color} size={26} />
							),
							tabBarActiveTintColor: '#ff9800',
							tabBarInactiveTintColor: '#616161',
						}}
						component={SettingsScreen}
					/>
				</Tab.Navigator>
			</PaperProvider>
		</NavigationContainer>
	);
};

const App = () => {
	const [appIsReady, setAppIsReady] = useState(false);

	useEffect(() => {
		async function prepare() {
			try {
				// Set the system UI background color to match the app theme
				await setBackgroundColorAsync('#212121');
				// Simulate any async initialization here if needed
				// For example: loading fonts, data, etc.
			} catch (e) {
				console.warn(e);
			} finally {
				// Tell the app to render
				setAppIsReady(true);
			}
		}

		prepare();
	}, []);

	const onLayoutRootView = useCallback(async () => {
		if (appIsReady) {
			// Hide the splash screen once the app is ready
			await SplashScreen.hideAsync();
		}
	}, [appIsReady]);

	if (!appIsReady) {
		return null;
	}

	return (
		<SafeAreaProvider onLayout={onLayoutRootView}>
			<AppContent />
		</SafeAreaProvider>
	);
};

export default App;
