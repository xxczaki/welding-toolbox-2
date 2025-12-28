import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useEffect, useState } from 'react';
import {
	ActionSheetIOS,
	Alert,
	Keyboard,
	KeyboardAvoidingView,
	Linking,
	Modal,
	Platform,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const isIPad = Platform.OS === 'ios' && (Platform as any).isPad;

import storage from '../storage';
import {
	borderRadius,
	colors,
	commonStyles,
	spacing,
	typography,
} from '../theme';
import type { CustomField, Settings } from '../types';

const SettingsScreen = () => {
	const insets = useSafeAreaInsets();
	const [settings, setSettings] = useState<Settings>({});
	const [modalVisible, setModalVisible] = useState<boolean>(false);
	const [customFieldName, setCustomFieldName] = useState<string>('');
	const [customFieldUnit, setCustomFieldUnit] = useState<string>('');

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

	const addCustomField = () => {
		if (!customFieldName.trim()) {
			Alert.alert('Error', 'Please enter a field name');
			return;
		}

		setSettings({
			...settings,
			customFields: [
				{
					name: customFieldName,
					unit: customFieldUnit,
					timestamp: Date.now(),
				},
				...(settings?.customFields || []),
			],
		});

		setCustomFieldName('');
		setCustomFieldUnit('');
		setModalVisible(false);
	};

	const deleteCustomField = (timestamp: number) => {
		Alert.alert(
			'Delete Field',
			'Are you sure you want to delete this custom field?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: () => {
						setSettings({
							...settings,
							customFields: settings?.customFields?.filter(
								(field: CustomField) => field.timestamp !== timestamp,
							),
						});
					},
				},
			],
		);
	};

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

						<View style={styles.settingsGroup}>
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
										false: colors.border,
										true: colors.primaryLight,
									}}
									thumbColor={
										settings?.lengthImperial
											? colors.primary
											: colors.surfaceVariant
									}
									ios_backgroundColor={colors.border}
								/>
							</View>

							<View style={styles.separator} />

							{/* Total Energy */}
							<View style={styles.settingItem}>
								<View style={styles.settingLabelContainer}>
									<Text style={styles.settingLabel}>
										Use total energy and length
									</Text>
									<Text style={styles.settingDescription}>(newer welders)</Text>
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
										false: colors.border,
										true: colors.primaryLight,
									}}
									thumbColor={
										settings?.totalEnergy
											? colors.primary
											: colors.surfaceVariant
									}
									ios_backgroundColor={colors.border}
								/>
							</View>
						</View>
					</View>

					{/* Custom Fields Section */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Custom Fields</Text>
						<Text style={styles.sectionDescription}>
							Custom fields don't affect calculations but are included in
							exports
						</Text>

						<TouchableOpacity
							style={[
								styles.addButton,
								(settings?.customFields?.length ?? 0) >= 4 &&
									styles.addButtonDisabled,
							]}
							onPress={() => setModalVisible(true)}
							disabled={(settings?.customFields?.length ?? 0) >= 4}
						>
							{Platform.OS === 'ios' ? (
								<SymbolView
									name="plus"
									size={18}
									type="hierarchical"
									tintColor={
										(settings?.customFields?.length ?? 0) >= 4
											? colors.textDisabled
											: colors.primary
									}
								/>
							) : (
								<MaterialCommunityIcons
									name="plus"
									size={20}
									color={
										(settings?.customFields?.length ?? 0) >= 4
											? colors.textDisabled
											: colors.primary
									}
								/>
							)}
							<Text
								style={[
									styles.addButtonText,
									(settings?.customFields?.length ?? 0) >= 4 &&
										styles.addButtonTextDisabled,
								]}
							>
								{(settings?.customFields?.length ?? 0) >= 4
									? 'Custom fields limit reached'
									: 'Add new field'}
							</Text>
						</TouchableOpacity>

						{settings?.customFields && settings?.customFields?.length > 0 && (
							<View style={styles.customFieldsList}>
								{settings?.customFields?.map(
									(field: CustomField, index: number) => (
										<React.Fragment key={field.timestamp}>
											<View style={styles.customFieldItem}>
												<View style={styles.customFieldInfo}>
													<Text style={styles.customFieldName}>
														{field.name}
													</Text>
													{field.unit && (
														<Text style={styles.customFieldUnit}>
															{field.unit}
														</Text>
													)}
												</View>
												<TouchableOpacity
													onPress={() => deleteCustomField(field.timestamp)}
													style={styles.deleteButton}
												>
													{Platform.OS === 'ios' ? (
														<SymbolView
															name="trash"
															size={18}
															type="hierarchical"
															tintColor={colors.error}
														/>
													) : (
														<MaterialCommunityIcons
															name="delete-outline"
															size={20}
															color={colors.error}
														/>
													)}
												</TouchableOpacity>
											</View>
											{index < (settings.customFields?.length ?? 0) - 1 && (
												<View style={styles.separator} />
											)}
										</React.Fragment>
									),
								)}
							</View>
						)}
					</View>
				</ScrollView>
			</KeyboardAvoidingView>

			{/* Add Custom Field Modal */}
			<Modal
				visible={modalVisible}
				transparent
				animationType="slide"
				onRequestClose={() => {
					setModalVisible(false);
					setCustomFieldName('');
					setCustomFieldUnit('');
				}}
			>
				<TouchableOpacity
					style={styles.modalOverlay}
					activeOpacity={1}
					onPress={() => {
						Keyboard.dismiss();
						setModalVisible(false);
						setCustomFieldName('');
						setCustomFieldUnit('');
					}}
				>
					<KeyboardAvoidingView
						behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
						style={styles.modalKeyboardView}
					>
						<TouchableOpacity
							activeOpacity={1}
							onPress={(e) => e.stopPropagation()}
							style={styles.modalContentWrapper}
						>
							<View style={styles.modalContent}>
								<View style={styles.modalHeader}>
									<Text style={styles.modalTitle}>Field Creator</Text>
									<TouchableOpacity
										onPress={() => {
											setModalVisible(false);
											setCustomFieldName('');
											setCustomFieldUnit('');
										}}
										style={styles.modalCloseButton}
									>
										<Text style={styles.modalCloseText}>✕</Text>
									</TouchableOpacity>
								</View>

								<View style={styles.modalInputContainer}>
									<Text style={styles.modalInputLabel}>Name</Text>
									<TextInput
										style={styles.modalInput}
										value={customFieldName}
										onChangeText={setCustomFieldName}
										placeholder="Enter field name"
										placeholderTextColor={colors.textSecondary}
										autoFocus
										returnKeyType="next"
									/>
								</View>

								<View style={styles.modalInputContainer}>
									<Text style={styles.modalInputLabel}>Unit (optional)</Text>
									<TextInput
										style={styles.modalInput}
										value={customFieldUnit}
										onChangeText={setCustomFieldUnit}
										placeholder="Enter unit"
										placeholderTextColor={colors.textSecondary}
										returnKeyType="done"
										onSubmitEditing={addCustomField}
									/>
								</View>

								<View style={styles.modalActions}>
									<TouchableOpacity
										style={styles.modalButton}
										onPress={() => {
											setModalVisible(false);
											setCustomFieldName('');
											setCustomFieldUnit('');
										}}
									>
										<Text style={styles.modalButtonText}>Cancel</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[styles.modalButton, styles.modalButtonPrimary]}
										onPress={addCustomField}
									>
										<Text
											style={[
												styles.modalButtonText,
												styles.modalButtonTextPrimary,
											]}
										>
											Add
										</Text>
									</TouchableOpacity>
								</View>
							</View>
						</TouchableOpacity>
					</KeyboardAvoidingView>
				</TouchableOpacity>
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
		paddingTop: Platform.OS === 'ios' ? (isIPad ? 110 : 60) : 32,
		paddingBottom: spacing.md,
		backgroundColor: colors.background,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.border,
		...Platform.select({
			ios: isIPad ? {
				paddingHorizontal: spacing.xxl * 2,
			} : {},
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
			ios: isIPad ? {
				paddingHorizontal: spacing.xxl * 2,
				maxWidth: 800,
				width: '100%',
				alignSelf: 'center',
			} : {},
		}),
	},
	section: {
		marginBottom: spacing.xl,
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
	sectionDescription: {
		...typography.caption1,
		color: colors.textSecondary,
		marginBottom: spacing.md,
		paddingHorizontal: spacing.md,
	},
	settingsGroup: {
		backgroundColor: colors.surface,
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
		marginLeft: spacing.md,
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
	customFieldsList: {
		backgroundColor: colors.surface,
		borderRadius: borderRadius.lg,
		overflow: 'hidden',
		marginTop: spacing.sm,
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
	addButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.lg,
		borderRadius: borderRadius.lg,
		backgroundColor: colors.surface,
		marginBottom: spacing.md,
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
	addButtonDisabled: {
		opacity: 0.5,
	},
	addButtonText: {
		...typography.body,
		color: colors.primary,
		marginLeft: spacing.sm,
		fontWeight: '600',
	},
	addButtonTextDisabled: {
		color: colors.textDisabled,
	},
	customFieldItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.md,
		minHeight: 52,
	},
	customFieldInfo: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
	},
	customFieldName: {
		...typography.body,
		color: colors.text,
	},
	customFieldUnit: {
		...typography.body,
		color: colors.textSecondary,
	},
	deleteButton: {
		padding: spacing.xs,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
	},
	modalKeyboardView: {
		justifyContent: 'flex-end',
	},
	modalContentWrapper: {
		width: '100%',
	},
	modalContent: {
		backgroundColor: colors.surface,
		borderTopLeftRadius: borderRadius.xl,
		borderTopRightRadius: borderRadius.xl,
		padding: spacing.lg,
		paddingBottom: Platform.OS === 'ios' ? spacing.xl + 20 : spacing.lg,
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: -2 },
				shadowOpacity: 0.25,
				shadowRadius: 10,
			},
			android: {
				elevation: 8,
			},
		}),
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: spacing.lg,
	},
	modalTitle: {
		...typography.title2,
		color: colors.text,
		flex: 1,
	},
	modalCloseButton: {
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 16,
		backgroundColor: colors.surfaceVariant,
	},
	modalCloseText: {
		fontSize: 18,
		color: colors.textSecondary,
		fontWeight: '600',
	},
	modalInputContainer: {
		marginBottom: spacing.lg,
	},
	modalInputLabel: {
		...typography.subheadline,
		color: colors.text,
		marginBottom: spacing.sm,
		fontWeight: '600',
	},
	modalInput: {
		...commonStyles.input,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
	},
	modalActions: {
		flexDirection: 'row',
		gap: spacing.sm,
		marginTop: spacing.md,
	},
	modalButton: {
		flex: 1,
		paddingVertical: spacing.md,
		borderRadius: borderRadius.lg,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.surfaceVariant,
		minHeight: 50,
	},
	modalButtonPrimary: {
		backgroundColor: colors.primary,
	},
	modalButtonText: {
		...typography.body,
		color: colors.text,
		fontWeight: '600',
		fontSize: 17,
	},
	modalButtonTextPrimary: {
		color: '#000',
	},
});

export default SettingsScreen;
