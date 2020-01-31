import React, {useState, useEffect} from 'react';
import {Picker} from 'react-native';
import {List, Switch, Button, Checkbox, Dialog, Portal, Paragraph, Snackbar} from 'react-native-paper';
import storage from '../storage.js';

import Container from '../components/container';

export default function SettingsScreen() {
	const [settings, setSettings] = useState({});
	const [visibleDialog, setVisibleDialog] = useState(false);
	const [visibleSnack, setVisibleSnack] = useState(false);

	useEffect(() => {
		storage.get('settings').then(data => {
			setSettings(JSON.parse(data));
		});
	}, []);

	useEffect(() => {
		storage.set('settings', JSON.stringify(settings));
	}, [settings]);

	return (
		<>
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
				<List.Section>
					<List.Subheader>Miscellaneous</List.Subheader>
					<List.Item
						title="Automatically send crash reports"
						left={() => (
							<Checkbox
								status={settings?.sentryDisable ? 'unchecked' : 'checked'}
								onPress={() => {
									if (!settings?.sentryDisable) {
										setVisibleDialog(true);
									} else {
										setSettings({...settings, sentryDisable: !settings?.sentryDisable});
										setVisibleSnack(true);
									}
								}}
							/>
						)}
					/>
					<Portal>
						<Dialog
							visible={visibleDialog}
							onDismiss={() => setVisibleDialog(false)}
						>
							<Dialog.Content>
								<Paragraph>We use Sentry to automatically collect anonymous information about crashes and errors.</Paragraph>
								<Paragraph>This information helps us improve Welding Toolbox 2.</Paragraph>
							</Dialog.Content>
							<Dialog.Actions>
								<Button
									onPress={() => {
										setVisibleDialog(false);
									}}
								>
									Close
								</Button>
								<Button
									onPress={() => {
										setSettings({...settings, sentryDisable: !settings?.sentryDisable});
										setVisibleDialog(false);
										setVisibleSnack(true);
									}}
								>
									Disable anyway
								</Button>
							</Dialog.Actions>
						</Dialog>
					</Portal>
				</List.Section>
			</Container>
			<Snackbar
				style={{}}
				visible={visibleSnack}
				duration={2000}
				action={{
					label: 'Dismiss',
					onPress: () => {
						setVisibleSnack(false);
					}
				}}
				onDismiss={() => setVisibleSnack(false)}
			>
				Please restart this app
			</Snackbar>
		</>
	);
}
