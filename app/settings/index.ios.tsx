import {
	Button,
	Form,
	Host,
	HStack,
	Image,
	Picker,
	Section,
	Spacer,
	Switch,
	Text,
	VStack,
} from '@expo/ui/swift-ui';
import { opacity } from '@expo/ui/swift-ui/modifiers';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
	getResultUnitLabels,
	getResultUnitValues,
	getTravelSpeedUnitLabels,
	getTravelSpeedUnitValues,
} from '../../constants/settings';
import storage from '../../storage';
import { colors } from '../../theme';
import type { Settings } from '../../types';

// Get arrays from constants
const resultUnitOptions = getResultUnitLabels();
const resultUnitValues = getResultUnitValues();
const travelSpeedUnitOptions = getTravelSpeedUnitLabels();
const travelSpeedUnitValues = getTravelSpeedUnitValues();

const SettingsScreen = () => {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [settings, setSettings] = useState<Settings>({});

	useFocusEffect(
		useCallback(() => {
			(async () => {
				const data = await storage.getItem('settings');
				if (data) {
					setSettings(JSON.parse(data));
				}
			})();
		}, []),
	);

	// Persist settings on change
	useEffect(() => {
		if (Object.keys(settings).length > 0) {
			(async () => {
				const data = await storage.getItem('settings');
				const existingSettings = data ? JSON.parse(data) : {};
				await storage.setItem(
					'settings',
					JSON.stringify({ ...existingSettings, ...settings }),
				);
			})();
		}
	}, [settings]);

	const updateSetting = <K extends keyof Settings>(
		key: K,
		value: Settings[K],
	) => {
		setSettings((prev) => ({ ...prev, [key]: value }));
	};

	const getResultUnitIndex = () => {
		const idx = resultUnitValues.indexOf(settings.resultUnit || 'mm');
		return idx >= 0 ? idx : 0;
	};

	const getTravelSpeedUnitIndex = () => {
		const idx = travelSpeedUnitValues.indexOf(
			settings.travelSpeedUnit || 'mm/min',
		);
		return idx >= 0 ? idx : 0;
	};

	return (
		<View style={styles.container}>
			<Host style={[styles.host, { paddingBottom: insets.bottom + 90 }]}>
				<Form>
					<Section title="Heat Input">
						{/* Result Unit Picker */}
						<Picker
							variant="menu"
							label="Result Unit"
							options={resultUnitOptions}
							selectedIndex={getResultUnitIndex()}
							onOptionSelected={({ nativeEvent: { index } }) => {
								updateSetting(
									'resultUnit',
									resultUnitValues[index] as Settings['resultUnit'],
								);
							}}
							color="secondary"
						/>

						{/* Travel Speed Unit Picker */}
						<Picker
							variant="menu"
							label="Travel Speed Unit"
							options={travelSpeedUnitOptions}
							selectedIndex={getTravelSpeedUnitIndex()}
							onOptionSelected={({ nativeEvent: { index } }) => {
								if (!settings.totalEnergy) {
									updateSetting(
										'travelSpeedUnit',
										travelSpeedUnitValues[index] as Settings['travelSpeedUnit'],
									);
								}
							}}
							color="secondary"
							modifiers={settings.totalEnergy ? [opacity(0.4)] : []}
						/>

						{/* Imperial Units Switch */}
						<Switch
							label="Use Imperial Units for Inputs"
							value={settings.lengthImperial || false}
							onValueChange={(value) => updateSetting('lengthImperial', value)}
							color="#ff9800"
						/>

						{/* Total Energy Switch */}
						<VStack alignment="leading" spacing={2}>
							<HStack>
								<Text>Use Total Energy and Length</Text>
								<Spacer />
								<Switch
									value={settings.totalEnergy || false}
									onValueChange={(value) => updateSetting('totalEnergy', value)}
									color="#ff9800"
								/>
							</HStack>
							<Text size={13} color="secondary">
								For newer welders.
							</Text>
						</VStack>

						{/* History Export Navigation */}
						<Button onPress={() => router.push('/settings/custom-fields')}>
							<VStack alignment="leading" spacing={2}>
								<HStack>
									<Text color="primary">History Export</Text>
									<Spacer />
									<Image
										systemName="chevron.right"
										size={14}
										color="secondary"
									/>
								</HStack>
								<Text size={13} color="secondary">
									Manage custom fields and column order.
								</Text>
							</VStack>
						</Button>
					</Section>
				</Form>
			</Host>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	host: {
		flex: 1,
	},
});

export default SettingsScreen;
