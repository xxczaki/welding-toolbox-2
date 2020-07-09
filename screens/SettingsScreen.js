import React, {useState, useEffect, useCallback} from 'react';
import {Linking, ScrollView, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {Picker} from '@react-native-community/picker';
import {List, Switch, Appbar, Button, Portal, Dialog, TextInput, Snackbar} from 'react-native-paper';
import {useForm, Controller} from 'react-hook-form';

import storage from '../storage.js';

const SettingsScreen = () => {
	const [settings, setSettings] = useState({});
	const [visible, setVisible] = useState(false);
	const [snackbar, setSnackbar] = useState(false);
	const {control, handleSubmit} = useForm({
		defaultValues: {
			name: '',
			unit: ''
		}
	});

	useFocusEffect(
		useCallback(() => {
			(async () => {
				const data = await storage.get('settings');

				setSettings(JSON.parse(data));
			})();
		}, [])
	);

	useEffect(() => {
		(async () => {
			const data = await storage.get('settings');

			await storage.set('settings', JSON.stringify({...JSON.parse(data), ...settings}));
		})();
	}, [settings]);

	const onSubmit = data => {
		setSettings({...settings, customFields: [
			{
				name: data.name,
				unit: data.unit,
				timestamp: Date.now()
			},
			...settings?.customFields
		]});
		hideDialog();
		onToggleSnackBar();
	};

	const showDialog = () => setVisible(true);
	const hideDialog = () => setVisible(false);
	const onToggleSnackBar = () => setSnackbar(!snackbar);
	const onDismissSnackBar = () => setSnackbar(false);

	return (
		<View style={{flex: 1}}>
			<Appbar.Header>
				<Appbar.Content title="Welding Toolbox 2"/>
				<Appbar.Action icon="gift-outline" onPress={() => Linking.openURL('https://www.paypal.me/akepinski')}/>
			</Appbar.Header>
			<ScrollView contentContainerStyle={{flexGrow: 1, backgroundColor: '#121212'}} keyboardShouldPersistTaps="handled">
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
					<List.Accordion
						title="Custom fields"
					>
						<Button icon={settings?.customFields?.length >= 4 ? null : 'plus'} disabled={settings?.customFields?.length >= 4} onPress={showDialog}>
							{settings?.customFields?.length >= 4 ? 'Custom fields limit reached' : 'Add new'}
						</Button>
						{settings?.customFields?.length === 0 || !settings?.customFields ? (
							<List.Item
								title="You do not have any custom fields."
								description="Custom fields do not affect the calculation, but they get added when exported to the spreadsheet file."
							/>
						) : settings?.customFields?.map(element => (
							<List.Item
								key={element.timestamp}
								title={element.name}
								description={`Unit: ${element.unit === '' ? 'N/A' : element.unit}`}
								right={() => (
									<Button onPress={() => setSettings({...settings, customFields: settings?.customFields.filter(key => key.timestamp !== element.timestamp)})}>
										Delete
									</Button>
								)}
							/>
						))}
					</List.Accordion>
				</List.Section>
				<Portal>
					<Dialog visible={visible} onDismiss={hideDialog}>
						<Dialog.Title>Field creator</Dialog.Title>
						<Dialog.Content>
							<View style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 130}}>
								<Controller
									control={control}
									render={({onChange, onBlur, value}) => (
										<TextInput
											label="Name"
											value={value}
											onBlur={onBlur}
											onChangeText={value => onChange(value)}
										/>
									)}
									name="name"
									rules={{required: true}}
									defaultValue=""
								/>
								<Controller
									control={control}
									render={({onChange, onBlur, value}) => (
										<TextInput
											label="Unit (optional)"
											value={value}
											onBlur={onBlur}
											onChangeText={value => onChange(value)}
										/>
									)}
									name="unit"
									defaultValue=""
								/>
							</View>
						</Dialog.Content>
						<Dialog.Actions>
							<Button onPress={hideDialog}>Cancel</Button>
							<Button
								icon="check"
								onPress={handleSubmit(onSubmit)}
							>
								Done
							</Button>
						</Dialog.Actions>
					</Dialog>
				</Portal>
				<Snackbar
					visible={snackbar}
					duration={1500}
					action={{
						label: 'Dismiss',
						onPress: () => {
							setSnackbar(false);
						}
					}}
					onDismiss={onDismissSnackBar}
				>
					Field created.
				</Snackbar>
			</ScrollView>
		</View>
	);
};

export default SettingsScreen;
