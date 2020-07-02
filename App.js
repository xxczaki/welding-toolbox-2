import 'react-native-gesture-handler';

import React from 'react';
import {StatusBar} from 'react-native';
import {DarkTheme, Provider as PaperProvider} from 'react-native-paper';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import AnimatedTabBar from '@gorhom/animated-tabbar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import HeatInputScreen from './screens/HeatInputScreen';
import WeldabilityScreen from './screens/WeldabilityScreen';
import SettingsScreen from './screens/SettingsScreen';

const theme = {
	...DarkTheme,
	colors: {
		...DarkTheme.colors,
		primary: '#ff9800',
		accent: '#c66900'
	}
};

const tabs = {
	HeatInput: {
		labelStyle: {
			color: '#ff9800'
		},
		icon: {
			component: () => <Icon name="fire" color="#ff9800" size={26}/>
		},
		background: {
			activeColor: '#424242'
		}
	},
	Weldability: {
		labelStyle: {
			color: '#ff9800'
		},
		icon: {
			component: () => <Icon name="calculator" color="#ff9800" size={26}/>
		},
		background: {
			activeColor: '#424242'
		}
	},
	Settings: {
		labelStyle: {
			color: '#ff9800'
		},
		icon: {
			component: () => <Icon name="settings-outline" color="#ff9800" size={26}/>
		},
		background: {
			activeColor: '#424242'
		}
	}
};

const Tab = createBottomTabNavigator();

const App = () => (
	<NavigationContainer>
		<PaperProvider theme={theme}>
			<StatusBar
				backgroundColor="#212121"
				barStyle="light-content"
			/>
			<Tab.Navigator
				tabBarOptions={{
					keyboardHidesTabBar: true
				}}
				tabBar={props => (
					<AnimatedTabBar tabBarOptions={{keyboardHidesTabBar: true}} style={{backgroundColor: '#272727'}} tabs={tabs} {...props}/>
				)}
			>
				<Tab.Screen
					name="HeatInput"
					options={{
						tabBarLabel: 'Heat Input'
					}}
					component={HeatInputScreen}
				/>
				<Tab.Screen
					name="Weldability"
					component={WeldabilityScreen}
				/>
				<Tab.Screen
					name="Settings"
					component={SettingsScreen}
				/>
			</Tab.Navigator>
		</PaperProvider>
	</NavigationContainer>
);

export default App;
