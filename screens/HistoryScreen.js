import React, {useState, useEffect} from 'react';
import {ScrollView, View, KeyboardAvoidingView, PermissionsAndroid, Platform} from 'react-native';
import {List, Portal, Dialog, Appbar, Button, Paragraph, Snackbar} from 'react-native-paper';
import RNFS, {writeFile} from 'react-native-fs';
import XLSX from 'xlsx';
import share from 'react-native-share';
import {nanoid} from 'nanoid/non-secure';

import storage from '../storage.js';

const HistoryScreen = ({navigation}) => {
	const [settings, setSettings] = useState({});
	const [visible, setVisible] = useState(false);
	const [snackbar, setSnackbar] = useState(false);

	useEffect(() => {
		(async () => {
			const data = await storage.getItem('settings');

			setSettings(JSON.parse(data));
		})();
	}, []);

	useEffect(() => {
		(async () => {
			const data = await storage.getItem('settings');

			await storage.setItem('settings', JSON.stringify({...JSON.parse(data), ...settings}));
		})();
	}, [settings]);

	const showDialog = () => setVisible(true);
	const hideDialog = () => setVisible(false);
	const onToggleSnackBar = () => setSnackbar(!snackbar);
	const onDismissSnackBar = () => setSnackbar(false);

	return (
		<View style={{flex: 1}}>
			<Appbar.Header>
				<Appbar.BackAction icon="back" onPress={() => navigation.navigate('Home')}/>
				<Appbar.Content title="History"/>
				<Appbar.Action
					icon="delete"
					onPress={() => {
						if (settings?.resultHistory && settings?.resultHistory?.length > 0) {
							showDialog();
						}
					}}
				/>
				<Appbar.Action
					icon="share"
					onPress={async () => {
						if (settings?.resultHistory && settings?.resultHistory?.length > 0) {
							const granted = Platform.OS === 'android' ? await PermissionsAndroid.check(
								'android.permission.WRITE_EXTERNAL_STORAGE'
							) : true;

							const saveAndShare = async () => {
								try {
									const newArray = settings?.resultHistory.sort((a, b) => a.Date - b.Date);

									const ws = XLSX.utils.json_to_sheet(newArray);
									const wb = XLSX.utils.book_new();
									XLSX.utils.book_append_sheet(wb, ws, 'WeldingToolbox2History');

									const id = nanoid(5);

									const wbout = XLSX.write(wb, {type: 'binary', bookType: 'xlsx'});
									const file = RNFS.DocumentDirectoryPath + `/result-history-${id}.xlsx`;
									await writeFile(file, wbout, 'ascii');

									await share.open({
										title: 'Result history',
										filename: `result-history-${id}.xlsx`,
										type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
										url: `file://${file}`
									});
								} catch {}
							};

							if (!granted && Platform.OS === 'android') {
								await PermissionsAndroid.request('android.permission.WRITE_EXTERNAL_STORAGE', {
									title: 'Information about permission',
									message: 'Welding Toolbox 2 requires write permission is order to share your result history. If you choose not to grant the app this permission, sharing your result history won\'t be available.',
									buttonPositive: 'Allow',
									buttonNegative: 'Disallow',
									buttonNeutral: 'I\'m not sure'
								});

								await saveAndShare();
							}

							if (granted) {
								await saveAndShare();
							}
						}
					}}
				/>
			</Appbar.Header>
			<KeyboardAvoidingView enabled style={{flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: '#121212'}} behavior="padding" keyboardVerticalOffset={50}>
				<ScrollView contentContainerStyle={{flexGrow: 1, backgroundColor: '#121212'}}>
					<List.Section>
						{settings?.resultHistory?.length === 0 || !settings?.resultHistory ? (
							<List.Item title="The history is empty."/>
						) : settings?.resultHistory.sort((a, b) => a.Date - b.Date).map(element => (
							<List.Item
								key={`${element.Date}-${element['Heat Input']}`}
								title={`Result: ${element['Heat Input']}`}
								description={element['Total energy'] !== 'N/A' ?
									`Total Energy: ${element['Total energy']}, Length: ${element.Length}` :
									`V: ${element.Voltage}, A: ${element.Amperage}, L: ${element.Length}, T: ${element.Time}, EF: ${element['Efficiency factor']}`}
								right={() => (
									<Button onPress={() => setSettings({...settings, resultHistory: settings?.resultHistory.filter(key => key.timestamp !== element.timestamp)})}>
										Delete
									</Button>
								)}
							/>
						))}
					</List.Section>
					<Portal>
						<Dialog visible={visible} onDismiss={hideDialog}>
							<Dialog.Title>Warning</Dialog.Title>
							<Dialog.Content>
								<Paragraph>This action will clear the whole result history and cannot be undone.</Paragraph>
							</Dialog.Content>
							<Dialog.Actions>
								<Button onPress={hideDialog}>Cancel</Button>
								<Button
									onPress={() => {
										setSettings({...settings, resultHistory: []});
										hideDialog();
										onToggleSnackBar();
									}}
								>
									Clear all
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
						Result history cleared.
					</Snackbar>
				</ScrollView>
			</KeyboardAvoidingView>
		</View>
	);
};

export default HistoryScreen;
