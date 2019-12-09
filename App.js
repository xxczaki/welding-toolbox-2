import React from 'react';
import {Platform, StatusBar} from 'react-native';
import {DarkTheme, Provider as PaperProvider} from 'react-native-paper';

import AppNavigator from './navigation/AppNavigator';

const theme = {
	...DarkTheme,
	colors: {
		...DarkTheme.colors,
		primary: '#ff9800',
		accent: '#c66900'
	}
};

export default function App() {
	return (
		<PaperProvider theme={theme}>
			{Platform.OS === 'ios' && <StatusBar barStyle="dark-content"/>}
			<AppNavigator/>
		</PaperProvider>
	);
}
