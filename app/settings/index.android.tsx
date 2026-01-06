import { Switch } from '@expo/ui/jetpack-compose';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
	getResultUnitLabel,
	getTravelSpeedUnitLabel,
	RESULT_UNIT_OPTIONS,
	TRAVEL_SPEED_UNIT_OPTIONS,
} from '../../constants/settings';
import storage from '../../storage';
import {
	borderRadius,
	colors,
	commonStyles,
	spacing,
	typography,
} from '../../theme';
import type { Settings } from '../../types';

const SettingsScreen = () => {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [settings, setSettings] = useState<Settings>({});
	const [resultUnitPickerVisible, setResultUnitPickerVisible] = useState(false);
	const [travelSpeedPickerVisible, setTravelSpeedPickerVisible] =
		useState(false);

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

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Settings</Text>
			</View>

			<ScrollView
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingBottom: insets.bottom + 20 },
				]}
			>
				{/* Heat Input Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Heat Input</Text>

					<View style={styles.settingsGroup}>
						{/* Result Unit - Picker */}
						<TouchableOpacity
							style={styles.settingItem}
							onPress={() => setResultUnitPickerVisible(true)}
							activeOpacity={0.7}
						>
							<Text style={styles.settingLabel}>Result Unit</Text>
							<View style={styles.settingValue}>
								<Text style={styles.settingValueText}>
									{getResultUnitLabel(settings.resultUnit || 'mm')}
								</Text>
								<MaterialCommunityIcons
									name="chevron-down"
									size={20}
									color={colors.textSecondary}
								/>
							</View>
						</TouchableOpacity>

						<View style={styles.separator} />

						{/* Travel Speed Unit - Picker */}
						<TouchableOpacity
							style={[
								styles.settingItem,
								settings.totalEnergy && styles.disabledItem,
							]}
							onPress={() =>
								!settings.totalEnergy && setTravelSpeedPickerVisible(true)
							}
							activeOpacity={settings.totalEnergy ? 1 : 0.7}
						>
							<Text
								style={[
									styles.settingLabel,
									settings.totalEnergy && styles.settingLabelDisabled,
								]}
							>
								Travel Speed Unit
							</Text>
							<View style={styles.settingValue}>
								<Text
									style={[
										styles.settingValueText,
										settings.totalEnergy && styles.settingLabelDisabled,
									]}
								>
									{getTravelSpeedUnitLabel(
										settings.travelSpeedUnit || 'mm/min',
									)}
								</Text>
								<MaterialCommunityIcons
									name="chevron-down"
									size={20}
									color={
										settings.totalEnergy
											? colors.textDisabled
											: colors.textSecondary
									}
								/>
							</View>
						</TouchableOpacity>

						<View style={styles.separator} />

						<View style={styles.settingItem}>
							<Text style={styles.settingLabel}>
								Use Imperial Units for Inputs
							</Text>
							<View style={styles.switchContainer}>
								<Switch
									value={settings.lengthImperial || false}
									onValueChange={(value) =>
										updateSetting('lengthImperial', value)
									}
									color={colors.primary}
									variant="switch"
								/>
							</View>
						</View>

						<View style={styles.separator} />

						{/* Total Energy - Jetpack Compose Switch */}
						<View style={styles.settingItem}>
							<View style={styles.settingLabelContainer}>
								<Text style={styles.settingLabel}>
									Use Total Energy and Length
								</Text>
								<Text style={styles.settingDescription}>
									For newer welders.
								</Text>
							</View>
							<View style={styles.switchContainer}>
								<Switch
									value={settings.totalEnergy || false}
									onValueChange={(value) => updateSetting('totalEnergy', value)}
									color={colors.primary}
									variant="switch"
								/>
							</View>
						</View>

						<View style={styles.separator} />

						{/* History Export Navigation */}
						<TouchableOpacity
							style={styles.settingItem}
							onPress={() => router.push('/settings/custom-fields')}
							activeOpacity={0.7}
						>
							<View style={styles.settingLabelContainer}>
								<Text style={styles.settingLabel}>History Export</Text>
								<Text style={styles.settingDescription}>
									Manage custom fields and column order.
								</Text>
							</View>
							<MaterialCommunityIcons
								name="chevron-right"
								size={20}
								color={colors.textSecondary}
							/>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>

			{/* Result Unit Picker Modal */}
			<Modal
				visible={resultUnitPickerVisible}
				transparent
				animationType="fade"
				onRequestClose={() => setResultUnitPickerVisible(false)}
			>
				<Pressable
					style={styles.modalOverlay}
					onPress={() => setResultUnitPickerVisible(false)}
				>
					<View style={styles.bottomSheetContent}>
						<Text style={styles.bottomSheetTitle}>Result Unit</Text>
						{RESULT_UNIT_OPTIONS.map((option) => (
							<TouchableOpacity
								key={option.value}
								style={[
									styles.bottomSheetOption,
									(settings.resultUnit || 'mm') === option.value &&
										styles.bottomSheetOptionSelected,
								]}
								onPress={() => {
									updateSetting(
										'resultUnit',
										option.value as Settings['resultUnit'],
									);
									setResultUnitPickerVisible(false);
								}}
							>
								<Text
									style={[
										styles.bottomSheetOptionText,
										(settings.resultUnit || 'mm') === option.value &&
											styles.bottomSheetOptionTextSelected,
									]}
								>
									{option.label}
								</Text>
								{(settings.resultUnit || 'mm') === option.value && (
									<MaterialCommunityIcons
										name="check"
										size={20}
										color={colors.primary}
									/>
								)}
							</TouchableOpacity>
						))}
					</View>
				</Pressable>
			</Modal>

			{/* Travel Speed Unit Picker Modal */}
			<Modal
				visible={travelSpeedPickerVisible}
				transparent
				animationType="fade"
				onRequestClose={() => setTravelSpeedPickerVisible(false)}
			>
				<Pressable
					style={styles.modalOverlay}
					onPress={() => setTravelSpeedPickerVisible(false)}
				>
					<View style={styles.bottomSheetContent}>
						<Text style={styles.bottomSheetTitle}>Travel Speed Unit</Text>
						{TRAVEL_SPEED_UNIT_OPTIONS.map((option) => (
							<TouchableOpacity
								key={option.value}
								style={[
									styles.bottomSheetOption,
									(settings.travelSpeedUnit || 'mm/min') === option.value &&
										styles.bottomSheetOptionSelected,
								]}
								onPress={() => {
									updateSetting(
										'travelSpeedUnit',
										option.value as Settings['travelSpeedUnit'],
									);
									setTravelSpeedPickerVisible(false);
								}}
							>
								<Text
									style={[
										styles.bottomSheetOptionText,
										(settings.travelSpeedUnit || 'mm/min') === option.value &&
											styles.bottomSheetOptionTextSelected,
									]}
								>
									{option.label}
								</Text>
								{(settings.travelSpeedUnit || 'mm/min') === option.value && (
									<MaterialCommunityIcons
										name="check"
										size={20}
										color={colors.primary}
									/>
								)}
							</TouchableOpacity>
						))}
					</View>
				</Pressable>
			</Modal>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		...commonStyles.container,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: spacing.md,
		paddingTop: 32,
		paddingBottom: spacing.md,
		backgroundColor: colors.background,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.border,
	},
	headerTitle: {
		...typography.largeTitle,
		color: colors.text,
	},
	headerButton: {
		padding: spacing.xs,
	},
	scrollContent: {
		padding: spacing.md,
	},
	section: {
		marginBottom: spacing.xl,
	},
	sectionTitle: {
		...typography.title3,
		color: colors.textSecondary,
		marginBottom: spacing.sm,
		paddingHorizontal: spacing.md,
	},
	settingsGroup: {
		backgroundColor: colors.surface,
		borderRadius: borderRadius.lg,
		overflow: 'hidden',
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
		elevation: 2,
	},
	settingItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.md,
		minHeight: 52,
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: colors.border,
		marginHorizontal: spacing.md,
	},
	settingLabelContainer: {
		flex: 1,
		marginRight: spacing.md,
		justifyContent: 'center',
	},
	settingLabel: {
		...typography.body,
		color: colors.text,
	},
	settingLabelDisabled: {
		color: colors.textSecondary,
	},
	settingDescription: {
		...typography.caption1,
		color: colors.textSecondary,
		marginTop: spacing.xs,
	},
	settingValue: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
	},
	switchContainer: {
		width: 52,
		height: 32,
		justifyContent: 'center',
		alignItems: 'center',
	},
	settingValueText: {
		...typography.body,
		color: colors.textSecondary,
	},
	disabledItem: {
		opacity: 0.4,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
	},
	bottomSheetContent: {
		backgroundColor: colors.surface,
		borderTopLeftRadius: borderRadius.xl,
		borderTopRightRadius: borderRadius.xl,
		padding: spacing.md,
		paddingBottom: spacing.xl,
	},
	bottomSheetTitle: {
		...typography.headline,
		color: colors.text,
		marginBottom: spacing.md,
		textAlign: 'center',
	},
	bottomSheetOption: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.sm,
		borderRadius: borderRadius.md,
	},
	bottomSheetOptionSelected: {
		backgroundColor: colors.surfaceVariant,
	},
	bottomSheetOptionText: {
		...typography.body,
		color: colors.text,
	},
	bottomSheetOptionTextSelected: {
		color: colors.primary,
		fontWeight: '600',
	},
});

export default SettingsScreen;
