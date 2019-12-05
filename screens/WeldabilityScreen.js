import React from 'react';
import {ScrollView, StyleSheet, Text} from 'react-native';

export default function WeldabilityScreen() {
	return (
		<ScrollView style={styles.container}>
			<Text>links</Text>
		</ScrollView>
	);
}

WeldabilityScreen.navigationOptions = {
	header: null
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 15,
		backgroundColor: '#fff'
	}
});
