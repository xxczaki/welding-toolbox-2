import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {DarkTheme, Provider as PaperProvider} from 'react-native-paper';
import {enableScreens} from 'react-native-screens';
import RNBootSplash from 'react-native-bootsplash';

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
	useEffect(() => {
		RNBootSplash.hide({duration: 250});
	}, []);

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
