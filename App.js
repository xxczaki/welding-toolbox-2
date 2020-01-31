import 'react-native-gesture-handler';

import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {DarkTheme, Provider as PaperProvider} from 'react-native-paper';
import {NavigationNativeContainer} from '@react-navigation/native';
import {createMaterialBottomTabNavigator} from '@react-navigation/material-bottom-tabs';
import RNBootSplash from 'react-native-bootsplash';
import * as Sentry from '@sentry/react-native';
import storage from './storage';

import TabBarIcon from './components/TabBarIcon';

import HeatInputScreen from './screens/HeatInputScreen';
import WeldabilityScreen from './screens/WeldabilityScreen';
import SettingsScreen from './screens/SettingsScreen';

storage.get('settings').then(data => {
	const settings = JSON.parse(data);

	if (!settings?.sentryDisable) {
		Sentry.init({
			dsn: 'https://43e9120ad3f34a1b8b2cb7b3b7ca428d@sentry.io/2125584'
		});
	}
});

const theme = {
	...DarkTheme,
	colors: {
		...DarkTheme.colors,
		primary: '#ff9800',
		accent: '#c66900'
	}
};

const Tab = createMaterialBottomTabNavigator();

export default function App() {
	useEffect(() => {
		RNBootSplash.hide({duration: 250});
	}, []);

	return (
		<NavigationNativeContainer>
			<PaperProvider theme={theme}>
				<StatusBar
					backgroundColor="#212121"
					barStyle="light-content"
				/>
				<Tab.Navigator
					shifting
					activeColor="#fff"
					inactiveColor="#ffca47"
					barStyle={{backgroundColor: '#ff9800'}}
				>
					<Tab.Screen
						name="HeatInput"
						component={HeatInputScreen}
						options={{
							tabBarLabel: 'Heat Input',
							tabBarColor: '#ff9800',
							tabBarIcon: ({focused}) => (
								<TabBarIcon focused={focused} name="fire"/>
							)
						}}
					/>
					<Tab.Screen
						name="Weldability"
						component={WeldabilityScreen}
						options={{
							tabBarLabel: 'Weldability',
							tabBarColor: '#c66900',
							tabBarIcon: ({focused}) => (
								<TabBarIcon focused={focused} name="calculator"/>
							)
						}}
					/>
					<Tab.Screen
						name="Settings"
						component={SettingsScreen}
						options={{
							tabBarLabel: 'Settings',
							tabBarColor: '#ffb74d',
							tabBarIcon: ({focused}) => (
								<TabBarIcon focused={focused} name="settings-outline"/>
							)
						}}
					/>
				</Tab.Navigator>
			</PaperProvider>
		</NavigationNativeContainer>
	);
}
