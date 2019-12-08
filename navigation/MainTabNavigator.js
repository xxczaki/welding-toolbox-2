import React from 'react';
import {createStackNavigator} from 'react-navigation';
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
	tabBarColor: '#ff9800'
};

HeatInputStack.path = '';

const WeldabilityStack = createStackNavigator(
	{
		Weldability: WeldabilityScreen
	}
);

WeldabilityStack.navigationOptions = {
	tabBarLabel: 'Weldability',
	tabBarIcon: ({focused}) => (
		<TabBarIcon focused={focused} name="calculator"/>
	),
	tabBarColor: '#c66900'
};

WeldabilityStack.path = '';

const AboutStack = createStackNavigator(
	{
		About: AboutScreen
	}
);

AboutStack.navigationOptions = {
	tabBarLabel: 'About',
	tabBarIcon: ({focused}) => (
		<TabBarIcon focused={focused} name="information-outline"/>
	),
	tabBarColor: '#ffb74d'
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
