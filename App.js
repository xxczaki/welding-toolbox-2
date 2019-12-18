import React from 'react';
import {StatusBar} from 'react-native';
import {DarkTheme, Provider as PaperProvider} from 'react-native-paper';
import {enableScreens} from 'react-native-screens';

import AppNavigator from './navigation/AppNavigator';

const theme = {
	...DarkTheme,
	colors: {
		...DarkTheme.colors,
		primary: '#ff9800',
		accent: '#c66900'
	}
};

enableScreens();

export default function App() {
	return (
		<PaperProvider theme={theme}>
			<StatusBar
				backgroundColor="#212121"
				barStyle="light-content"
			/>
			<AppNavigator/>
		</PaperProvider>
	);
}
