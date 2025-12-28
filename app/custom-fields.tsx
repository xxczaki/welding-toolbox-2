import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useEffect, useState } from 'react';
import {
	Alert,
	Keyboard,
	KeyboardAvoidingView,
	Modal,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import storage from '../storage';
import {
	borderRadius,
	colors,
	commonStyles,
	spacing,
	typography,
} from '../theme';
import type { CustomField, Settings } from '../types';
import { isIPad } from '../utils/platform';

const CustomFieldsScreen = () => {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [settings, setSettings] = useState<Settings>({});
	const [modalVisible, setModalVisible] = useState<boolean>(false);
	const [customFieldName, setCustomFieldName] = useState<string>('');
	const [customFieldUnit, setCustomFieldUnit] = useState<string>('');
	const nameInputRef = React.useRef<TextInput>(null);
	const unitInputRef = React.useRef<TextInput>(null);

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
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.backButton}
				>
					{Platform.OS === 'ios' ? (
						<SymbolView
							name="chevron.left"
							size={20}
							type="hierarchical"
							tintColor={colors.primary}
						/>
					) : (
						<MaterialCommunityIcons
							name="arrow-left"
							size={24}
							color={colors.primary}
						/>
					)}
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Custom Fields</Text>
				<View style={styles.headerSpacer} />
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
					{settings?.customFields && settings?.customFields?.length > 0 ? (
						<GlassView
							glassEffectStyle="clear"
							style={[
								styles.settingsGroup,
								Platform.OS === 'android' && styles.glassAndroidFallback,
							]}
						>
							{settings.customFields.map(
								(field: CustomField, index: number) => (
									<React.Fragment key={field.timestamp}>
										{index > 0 && <View style={styles.separator} />}
										<View style={styles.settingItem}>
											<View style={styles.customFieldInfo}>
												<Text style={styles.customFieldName}>{field.name}</Text>
												{field.unit && (
													<Text style={styles.customFieldUnit}>
														{field.unit}
													</Text>
												)}
											</View>
											<TouchableOpacity
												onPress={() => deleteCustomField(field.timestamp)}
												style={styles.deleteIconButton}
											>
												{Platform.OS === 'ios' ? (
													<SymbolView
														name="trash"
														size={16}
														type="hierarchical"
														tintColor={colors.textSecondary}
													/>
												) : (
													<MaterialCommunityIcons
														name="delete-outline"
														size={20}
														color={colors.textSecondary}
													/>
												)}
											</TouchableOpacity>
										</View>
									</React.Fragment>
								),
							)}
						</GlassView>
					) : (
						<View style={styles.emptyState}>
							<Text style={styles.emptyStateText}>
								No custom fields yet. Add one to get started.
							</Text>
						</View>
					)}

					<GlassView
						glassEffectStyle="clear"
						style={[
							styles.addFieldButtonGroup,
							Platform.OS === 'android' && styles.glassAndroidFallback,
						]}
					>
						<TouchableOpacity
							onPress={() => setModalVisible(true)}
							disabled={(settings?.customFields?.length ?? 0) >= 4}
							style={styles.addFieldButton}
						>
							<Text
								style={[
									styles.addFieldButtonText,
									(settings?.customFields?.length ?? 0) >= 4 &&
										styles.addFieldButtonTextDisabled,
								]}
							>
								Add Field
							</Text>
						</TouchableOpacity>
					</GlassView>

					<Text style={styles.customFieldsExplainer}>
						Custom fields for heat input don't affect calculations and are
						included in the exported history file.
					</Text>
					{(settings?.customFields?.length ?? 0) > 0 && (
						<Text style={styles.customFieldsCount}>
							{settings?.customFields?.length ?? 0} of 4 fields
						</Text>
					)}
				</ScrollView>
			</KeyboardAvoidingView>

			{/* Add Custom Field Modal */}
			<Modal
				visible={modalVisible}
				transparent
				statusBarTranslucent
				onRequestClose={() => {
					setModalVisible(false);
					setCustomFieldName('');
					setCustomFieldUnit('');
				}}
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					style={[styles.modalOverlay, { paddingTop: insets.top + 60 }]}
				>
					<TouchableOpacity
						style={styles.modalOverlayTouchable}
						activeOpacity={1}
						onPress={() => {
							Keyboard.dismiss();
							setModalVisible(false);
							setCustomFieldName('');
							setCustomFieldUnit('');
						}}
					>
						<View style={styles.modalContentWrapper}>
							<TouchableOpacity
								activeOpacity={1}
								onPress={(e) => e.stopPropagation()}
							>
								<View style={styles.modalContent}>
									<View style={styles.modalHeader}>
										<Text style={styles.modalTitle}>Field Creator</Text>
										<GlassView
											glassEffectStyle="clear"
											style={[
												styles.modalCloseButtonGlass,
												Platform.OS === 'android' &&
													styles.glassButtonAndroidFallback,
											]}
										>
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
										</GlassView>
									</View>

									<View style={styles.modalInputContainer}>
										<Text style={styles.modalInputLabel}>Name</Text>
										<TextInput
											ref={nameInputRef}
											style={[
												styles.modalInput,
												!customFieldName.trim() && customFieldName.length > 0
													? styles.modalInputError
													: {},
											]}
											value={customFieldName}
											onChangeText={setCustomFieldName}
											placeholder="Enter field name"
											placeholderTextColor={colors.textSecondary}
											autoFocus
											returnKeyType="next"
											onSubmitEditing={() => unitInputRef.current?.focus()}
											blurOnSubmit={false}
										/>
										{!customFieldName.trim() && customFieldName.length > 0 && (
											<Text style={styles.errorText}>
												Field name is required
											</Text>
										)}
									</View>

									<View style={styles.modalInputContainer}>
										<Text style={styles.modalInputLabel}>Unit (optional)</Text>
										<TextInput
											ref={unitInputRef}
											style={styles.modalInput}
											value={customFieldUnit}
											onChangeText={setCustomFieldUnit}
											placeholder="Enter unit"
											placeholderTextColor={colors.textSecondary}
											returnKeyType="done"
											onSubmitEditing={() => {
												if (customFieldName.trim()) {
													addCustomField();
												}
											}}
										/>
									</View>

									<View style={styles.modalActions}>
										<GlassView
											glassEffectStyle="clear"
											style={[
												styles.modalButtonGlass,
												Platform.OS === 'android' &&
													styles.glassButtonAndroidFallback,
											]}
										>
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
										</GlassView>
										<GlassView
											glassEffectStyle="clear"
											style={[
												styles.modalButtonGlass,
												Platform.OS === 'android' &&
													styles.glassButtonAndroidFallback,
											]}
										>
											<TouchableOpacity
												style={[
													styles.modalButton,
													styles.modalButtonPrimary,
													!customFieldName.trim() && styles.modalButtonDisabled,
												]}
												onPress={addCustomField}
												disabled={!customFieldName.trim()}
											>
												<Text
													style={[
														styles.modalButtonText,
														styles.modalButtonTextPrimary,
														!customFieldName.trim() &&
															styles.modalButtonTextDisabled,
													]}
												>
													Add
												</Text>
											</TouchableOpacity>
										</GlassView>
									</View>
								</View>
							</TouchableOpacity>
						</View>
					</TouchableOpacity>
				</KeyboardAvoidingView>
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
	backButton: {
		padding: spacing.xs,
	},
	headerTitle: {
		...typography.largeTitle,
		color: colors.text,
		flex: 1,
		textAlign: 'center',
	},
	headerSpacer: {
		width: 40,
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
	settingsGroup: {
		borderRadius: borderRadius.lg,
		overflow: 'hidden',
		marginBottom: spacing.sm,
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
	deleteIconButton: {
		padding: spacing.xs,
	},
	emptyState: {
		padding: spacing.xl,
		alignItems: 'center',
	},
	emptyStateText: {
		...typography.body,
		color: colors.textSecondary,
		textAlign: 'center',
	},
	addFieldButtonGroup: {
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
	addFieldButton: {
		paddingVertical: spacing.md,
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 52,
	},
	addFieldButtonText: {
		...typography.body,
		color: Platform.select({
			ios: '#007AFF',
			android: colors.primary,
		}),
		fontSize: 17,
		fontWeight: '400',
	},
	addFieldButtonTextDisabled: {
		color: colors.textDisabled,
		opacity: 0.5,
	},
	customFieldsExplainer: {
		...typography.footnote,
		color: colors.textSecondary,
		marginTop: spacing.md,
		paddingHorizontal: spacing.md,
		lineHeight: 18,
	},
	customFieldsCount: {
		...typography.footnote,
		color: colors.textSecondary,
		marginTop: spacing.xs,
		paddingHorizontal: spacing.md,
		textAlign: 'center',
	},
	modalOverlay: {
		flex: 1,
		justifyContent: 'flex-start',
		width: '100%',
	},
	modalOverlayTouchable: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.75)',
		justifyContent: 'flex-start',
		width: '100%',
		paddingHorizontal: spacing.md,
	},
	modalContentWrapper: {
		width: '100%',
		alignItems: 'stretch',
		maxWidth: 500,
		alignSelf: 'center',
	},
	modalContent: {
		width: '100%',
		backgroundColor: colors.surface,
		borderRadius: borderRadius.xl,
		padding: spacing.xl,
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 4 },
				shadowOpacity: 0.3,
				shadowRadius: 16,
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
	modalCloseButtonGlass: {
		width: 32,
		height: 32,
		borderRadius: 16,
		overflow: 'hidden',
	},
	modalCloseButton: {
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
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
	modalInputError: {
		borderColor: colors.error,
		borderWidth: 1,
	},
	errorText: {
		...typography.caption1,
		color: colors.error,
		marginTop: spacing.xs,
	},
	modalActions: {
		flexDirection: 'row',
		gap: spacing.sm,
		marginTop: spacing.md,
	},
	modalButtonGlass: {
		flex: 1,
		borderRadius: borderRadius.lg,
		overflow: 'hidden',
	},
	modalButton: {
		paddingVertical: spacing.md,
		alignItems: 'center',
		justifyContent: 'center',
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
	modalButtonDisabled: {
		opacity: 0.4,
	},
	modalButtonTextDisabled: {
		opacity: 0.6,
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

export default CustomFieldsScreen;
