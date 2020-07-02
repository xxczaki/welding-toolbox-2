import React, {useState, useEffect} from 'react';
import {Linking} from 'react-native';
import {Picker} from '@react-native-community/picker';
import {List, Switch, Appbar} from 'react-native-paper';
import storage from '../storage.js';

import Container from '../components/container';

const SettingsScreen = () => {
	const [settings, setSettings] = useState({});

	useEffect(() => {
		(async () => {
			const data = await storage.get('settings');

			setSettings(JSON.parse(data));
		})();
	}, []);

	useEffect(() => {
		storage.set('settings', JSON.stringify(settings));
	}, [settings]);

	return (
		<>
			<Appbar.Header>
				<Appbar.Content title="Welding Toolbox 2"/>
				<Appbar.Action icon="gift-outline" onPress={() => Linking.openURL('https://www.paypal.me/akepinski')}/>
			</Appbar.Header>
			<Container scrollEnabled={false}>
				<List.Section>
					<List.Subheader>Heat Input</List.Subheader>
					<List.Item
						title="Display result in:"
						right={() => (
							<Picker
								selectedValue={settings?.resultUnit || 'mm'}
								mode="dropdown"
								style={{color: 'gray', height: 36, width: 125}}
								onValueChange={itemValue => {
									setSettings({...settings, resultUnit: itemValue});
								}}
							>
								<Picker.Item label="kJ/mm" value="mm"/>
								<Picker.Item label="kJ/cm" value="cm"/>
								<Picker.Item label="kJ/in" value="in"/>
							</Picker>
						)}
					/>
					<List.Item
						title="Enter length/diameter in inches"
						right={() => (
							<Switch
								value={settings?.lengthImperial}
								onValueChange={() => {
									setSettings({...settings, lengthImperial: !settings?.lengthImperial});
								}}
							/>
						)}
					/>
					<List.Item
						title="Use total energy and length (newer welders)"
						right={() => (
							<Switch
								value={settings?.totalEnergy}
								onValueChange={() => {
									setSettings({...settings, totalEnergy: !settings?.totalEnergy});
								}}
							/>
						)}
					/>
				</List.Section>
			</Container>
		</>
	);
};

export default SettingsScreen;
