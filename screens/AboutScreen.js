import React from 'react';
import {Image, Linking} from 'react-native';
import {Title, Text, Caption, Button} from 'react-native-paper';

import Container from '../components/container';

export default function AboutScreen() {
	return (
		<Container
			contentContainerStyle={{alignItems: 'center', justifyContent: 'center'}}
			scrollEnabled={false}
		>
			<Image style={{width: 128, height: 128, marginBottom: 15}} source={require('../assets/images/icon.png')}/>
			<Title style={{fontSize: 28}}>Welding Toolbox 2</Title>
			<Text style={{paddingBottom: 20}}>If you enjoy using this app, please rate it :)</Text>
			<Button style={{marginBottom: 10, width: 200}} color="#333" icon="github-circle" mode="contained" onPress={() => Linking.openURL('https://github.com/xxczaki/welding-toolbox-2')}>
			Source code
			</Button>
			<Button style={{width: 200}} color="#009cde" icon="paypal" mode="contained" onPress={() => Linking.openURL('https://paypal.me/akepinski')}>
			Donate
			</Button>
			<Caption style={{paddingTop: 20}}>MIT © Antoni Kepinski</Caption>
		</Container>
	);
}

AboutScreen.navigationOptions = {
	header: null
};
