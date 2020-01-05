import React from 'react';
import {createStackNavigator} from 'react-navigation-stack';
import {createMaterialBottomTabNavigator} from 'react-navigation-material-bottom-tabs';

import TabBarIcon from '../components/TabBarIcon';
import HeatInputScreen from '../screens/HeatInputScreen';
import WeldabilityScreen from '../screens/WeldabilityScreen';
import AboutScreen from '../screens/AboutScreen';

const HeatInputStack = createStackNavigator(
	{
		HeatInput: HeatInputScreen
	}
);

HeatInputStack.navigationOptions = {
	tabBarLabel: 'Heat Input',
	tabBarIcon: ({focused}) => (
		<TabBarIcon
			focused={focused}
			name="fire"
		/>
	),
	tabBarColor: '#ff9800',
	cardStyle: {backgroundColor: '#121212'}
};

HeatInputStack.path = '';

const WeldabilityStack = createStackNavigator(
	{
		Weldability: WeldabilityScreen
	},
	{
		cardStyle: {backgroundColor: '#121212'}
	}
);

WeldabilityStack.navigationOptions = {
	tabBarLabel: 'Weldability',
	tabBarIcon: ({focused}) => (
		<TabBarIcon focused={focused} name="calculator"/>
	),
	tabBarColor: '#c66900',
	cardStyle: {backgroundColor: '#121212'}
};

WeldabilityStack.path = '';

const AboutStack = createStackNavigator(
	{
		About: AboutScreen
	},
	{
		cardStyle: {backgroundColor: '#121212'}
	}
);

AboutStack.navigationOptions = {
	tabBarLabel: 'About',
	tabBarIcon: ({focused}) => (
		<TabBarIcon focused={focused} name="information-outline"/>
	),
	tabBarColor: '#ffb74d',
	cardStyle: {backgroundColor: '#121212'}
};

AboutStack.path = '';

const tabNavigator = createMaterialBottomTabNavigator({
	HeatInputStack,
	WeldabilityStack,
	AboutStack
},
{
	shifting: true,
	activeColor: '#ffffff',
	inactiveColor: '#ffca47',
	barStyle: {backgroundColor: '#ff9800'}
});

tabNavigator.path = '';

export default tabNavigator;
