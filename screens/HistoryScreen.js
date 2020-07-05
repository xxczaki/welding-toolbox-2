import React, {useState, useEffect} from 'react';
import {ScrollView, View, PermissionsAndroid} from 'react-native';
import {List, Portal, Dialog, Appbar, Button, Paragraph, Snackbar} from 'react-native-paper';
import RNFS, {writeFile} from 'react-native-fs';
import XLSX from 'xlsx';
import share from 'react-native-share';

import storage from '../storage.js';

const HistoryScreen = ({navigation}) => {
	const [settings, setSettings] = useState({});
	const [visible, setVisible] = useState(false);
	const [snackbar, setSnackbar] = useState(false);

	useEffect(() => {
		(async () => {
			const data = await storage.get('settings');

			setSettings(JSON.parse(data));
		})();
	}, []);

	useEffect(() => {
		(async () => {
			const data = await storage.get('settings');

			await storage.set('settings', JSON.stringify({...JSON.parse(data), ...settings}));
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
							const granted = await PermissionsAndroid.check(
								'android.permission.WRITE_EXTERNAL_STORAGE'
							);

							const saveAndShare = async () => {
								try {
									const ws = XLSX.utils.json_to_sheet(settings?.resultHistory);
									const wb = XLSX.utils.book_new();
									XLSX.utils.book_append_sheet(wb, ws, 'WeldingToolbox2History');

									const wbout = XLSX.write(wb, {type: 'binary', bookType: 'xlsx'});
									const file = RNFS.DocumentDirectoryPath + '/result-history.xlsx';
									await writeFile(file, wbout, 'ascii');

									await share.open({
										title: 'Result history',
										message: 'Download result history as a XLS file.',
										filename: 'history.xlsx',
										type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
										url: `file://${file}`
									});
								} catch (error) {
									console.log(error);
								}
							};

							if (!granted) {
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
			<ScrollView contentContainerStyle={{flexGrow: 1, backgroundColor: '#121212'}}>
				<List.Section>
					{settings?.resultHistory?.length === 0 || !settings?.resultHistory ? (
						<List.Item title="The history is empty."/>
					) : settings?.resultHistory?.map(element => (
						<List.Item
							key={element.timestamp}
							title={`Result: ${element.result}`}
							description={element.totalEnergy ?
								`Total Energy: ${element.totalEnergy}, Length: ${element.length}` :
								`V: ${element.voltage}, A: ${element.amperage}, L: ${element.length}, T: ${element.time}s, EF: ${element.efficiencyFactor}`}
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
		</View>
	);
};

export default HistoryScreen;
