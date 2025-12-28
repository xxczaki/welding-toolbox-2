import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import {
	ActionSheetIOS,
	Alert,
	KeyboardAvoidingView,
	Linking,
	Platform,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import storage from '../../storage';
import {
	borderRadius,
	colors,
	commonStyles,
	spacing,
	typography,
} from '../../theme';
import type { Settings } from '../../types';
import { isIPad } from '../../utils/platform';

const SettingsScreen = () => {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [settings, setSettings] = useState<Settings>({});
	const [isLayoutReady, setIsLayoutReady] = useState<boolean>(false);

	const resultUnitOptions = [
		{ label: 'kJ/mm', value: 'mm' },
		{ label: 'kJ/cm', value: 'cm' },
		{ label: 'kJ/in', value: 'in' },
	];

	const showResultUnitPicker = () => {
		if (Platform.OS === 'ios') {
			ActionSheetIOS.showActionSheetWithOptions(
				{
					options: ['Cancel', ...resultUnitOptions.map((o) => o.label)],
					cancelButtonIndex: 0,
				},
				(buttonIndex) => {
					if (buttonIndex > 0) {
						const selectedOption = resultUnitOptions[buttonIndex - 1];
						setSettings({
							...settings,
							resultUnit: selectedOption.value as 'mm' | 'cm' | 'in',
						});
					}
				},
			);
		} else {
			Alert.alert('Display result in', '', [
				...resultUnitOptions.map((option) => ({
					text: option.label,
					onPress: () =>
						setSettings({
							...settings,
							resultUnit: option.value as 'mm' | 'cm' | 'in',
						}),
				})),
				{ text: 'Cancel', style: 'cancel' as const },
			]);
		}
	};

	const getResultUnitLabel = () => {
		const option = resultUnitOptions.find(
			(o) => o.value === (settings?.resultUnit || 'mm'),
		);
		return option ? option.label : 'kJ/mm';
	};

	useFocusEffect(
		useCallback(() => {
			(async () => {
				const data = await storage.getItem('settings');
				if (data) {
					setSettings(JSON.parse(data));
				}
			})();
			// Reset layout ready state when screen comes into focus
			setIsLayoutReady(false);
		}, []),
	);

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

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Settings</Text>
				{Platform.OS === 'android' && (
					<TouchableOpacity
						onPress={() => Linking.openURL('https://liberapay.com/xxczaki/')}
						style={styles.headerButton}
					>
						<MaterialCommunityIcons
							name="gift-outline"
							size={24}
							color={colors.primary}
						/>
					</TouchableOpacity>
				)}
			</View>

			<KeyboardAvoidingView
				enabled
				style={{ flex: 1 }}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<ScrollView
					contentContainerStyle={[
						styles.scrollContent,
						{
							paddingBottom: Platform.OS === 'ios' ? insets.bottom + 90 : 20,
						},
					]}
					keyboardShouldPersistTaps="handled"
				>
					{/* Heat Input Section */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Heat Input</Text>

						<View
							onLayout={() => {
								// Force GlassView to re-render after layout with a small delay
								// to ensure the background is ready for the glass effect
								if (!isLayoutReady) {
									setTimeout(() => {
										setIsLayoutReady(true);
									}, 50);
								}
							}}
						>
							<GlassView
								key={isLayoutReady ? 'glass-ready' : 'glass-initial'}
								glassEffectStyle="clear"
								style={[
									styles.settingsGroup,
									Platform.OS === 'android' && styles.glassAndroidFallback,
								]}
							>
								{/* Result Unit */}
								<View style={styles.settingItem}>
									<Text style={styles.settingLabel}>Display result in</Text>
									<TouchableOpacity
										style={styles.settingValue}
										onPress={showResultUnitPicker}
									>
										<Text style={styles.settingValueText}>
											{getResultUnitLabel()}
										</Text>
										{Platform.OS === 'ios' ? (
											<SymbolView
												name="chevron.right"
												size={14}
												type="hierarchical"
												tintColor={colors.textSecondary}
											/>
										) : (
											<MaterialCommunityIcons
												name="chevron-right"
												size={18}
												color={colors.textSecondary}
											/>
										)}
									</TouchableOpacity>
								</View>

								<View style={styles.separator} />

								{/* Length Imperial */}
								<View style={styles.settingItem}>
									<View style={styles.settingLabelContainer}>
										<Text style={styles.settingLabel}>
											Enter length/diameter in inches
										</Text>
									</View>
									<Switch
										value={settings?.lengthImperial || false}
										onValueChange={() =>
											setSettings({
												...settings,
												lengthImperial: !settings?.lengthImperial,
											})
										}
										trackColor={{
											false: '#39393d',
											true: colors.primaryLight,
										}}
										thumbColor={
											settings?.lengthImperial ? colors.primary : '#ffffff'
										}
										ios_backgroundColor="#39393d"
									/>
								</View>

								<View style={styles.separator} />

								{/* Total Energy */}
								<View style={styles.settingItem}>
									<View style={styles.settingLabelContainer}>
										<Text style={styles.settingLabel}>
											Use total energy and length
										</Text>
										<Text style={styles.settingDescription}>
											For newer welders.
										</Text>
									</View>
									<Switch
										value={settings?.totalEnergy || false}
										onValueChange={() =>
											setSettings({
												...settings,
												totalEnergy: !settings?.totalEnergy,
											})
										}
										trackColor={{
											false: '#39393d',
											true: colors.primaryLight,
										}}
										thumbColor={
											settings?.totalEnergy ? colors.primary : '#ffffff'
										}
										ios_backgroundColor="#39393d"
									/>
								</View>

								<View style={styles.separator} />

								{/* Custom Fields */}
								<TouchableOpacity
									style={styles.settingItem}
									onPress={() => {
										router.push('/settings/custom-fields');
									}}
								>
									<View style={styles.settingLabelContainer}>
										<Text style={styles.settingLabel}>Custom Fields</Text>
										<Text style={styles.settingDescription}>
											Used in history file exports.
										</Text>
									</View>
									<View style={styles.settingValue}>
										<Text style={styles.settingValueText}>
											{settings?.customFields?.length ?? 0}/4
										</Text>
										{Platform.OS === 'ios' ? (
											<SymbolView
												name="chevron.right"
												size={14}
												type="hierarchical"
												tintColor={colors.textSecondary}
											/>
										) : (
											<MaterialCommunityIcons
												name="chevron-right"
												size={18}
												color={colors.textSecondary}
											/>
										)}
									</View>
								</TouchableOpacity>
							</GlassView>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
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
		paddingTop: Platform.OS === 'ios' ? (isIPad() ? 110 : 60) : 32,
		paddingBottom: spacing.md,
		backgroundColor: colors.background,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.border,
		...Platform.select({
			ios: isIPad()
				? {
						paddingHorizontal: spacing.xxl * 2,
					}
				: {},
		}),
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
		...Platform.select({
			ios: isIPad()
				? {
						paddingHorizontal: spacing.xxl * 2,
						maxWidth: 800,
						width: '100%',
						alignSelf: 'center',
					}
				: {},
		}),
	},
	section: {
		marginBottom: spacing.xl,
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: spacing.sm,
		paddingHorizontal: spacing.md,
		marginTop: 0,
	},
	sectionTitle: {
		...typography.title3,
		color: colors.textSecondary,
		marginBottom: spacing.sm,
		paddingHorizontal: spacing.md,
		...Platform.select({
			ios: {
				textTransform: 'uppercase',
				fontSize: 13,
				fontWeight: '600',
				letterSpacing: -0.08,
			},
		}),
	},
	sectionHelperText: {
		...typography.caption1,
		color: colors.textSecondary,
		...Platform.select({
			ios: {
				fontSize: 13,
				fontWeight: '400',
			},
		}),
	},
	sectionDescription: {
		...typography.caption1,
		color: colors.textSecondary,
		marginBottom: spacing.md,
		paddingHorizontal: spacing.md,
	},
	settingsGroup: {
		borderRadius: borderRadius.lg,
		overflow: 'hidden',
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.1,
				shadowRadius: 8,
			},
			android: {
				elevation: 2,
			},
		}),
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
	settingValueText: {
		...typography.body,
		color: colors.textSecondary,
	},
	glassAndroidFallback: {
		backgroundColor: colors.surface,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
	},
	glassButtonAndroidFallback: {
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: 'rgba(255, 255, 255, 0.15)',
	},
});

export default SettingsScreen;
