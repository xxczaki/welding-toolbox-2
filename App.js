import React from 'react';
import {Platform, StatusBar} from 'react-native';
import {Provider as PaperProvider} from 'react-native-paper';

import AppNavigator from './navigation/AppNavigator';

export default function App() {
	return (
		<PaperProvider>
			{Platform.OS === 'ios' && <StatusBar barStyle="default"/>}
			<AppNavigator/>
		</PaperProvider>
	);
}
