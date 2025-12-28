import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import storage from '../../storage';
import {
	borderRadius,
	colors,
	commonStyles,
	spacing,
	typography,
} from '../../theme';
import type { CustomField, Settings } from '../../types';
import { isIPad } from '../../utils/platform';

const CustomFieldsScreen = () => {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [settings, setSettings] = useState<Settings>({});
	const [modalVisible, setModalVisible] = useState<boolean>(false);
	const [customFieldName, setCustomFieldName] = useState<string>('');
	const [customFieldUnit, setCustomFieldUnit] = useState<string>('');
	const nameInputRef = useRef<TextInput>(null);
	const unitInputRef = useRef<TextInput>(null);

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
				<View style={styles.backButtonContainer}>
					<GlassView
						glassEffectStyle="clear"
						style={[
							styles.liquidGlassButtonCircular,
							Platform.OS === 'android' && styles.glassButtonAndroidFallback,
						]}
					>
						<TouchableOpacity
							onPress={() => router.back()}
							style={styles.circularButton}
						>
							{Platform.OS === 'ios' ? (
								<SymbolView
									name="chevron.left"
									size={20}
									type="hierarchical"
									tintColor={colors.text}
								/>
							) : (
								<MaterialCommunityIcons
									name="arrow-left"
									size={24}
									color={colors.text}
								/>
							)}
						</TouchableOpacity>
					</GlassView>
				</View>
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
									<View key={field.timestamp}>
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
														name="minus.circle.fill"
														size={24}
														type="hierarchical"
														tintColor={colors.error}
													/>
												) : (
													<MaterialCommunityIcons
														name="minus-circle"
														size={24}
														color={colors.error}
													/>
												)}
											</TouchableOpacity>
										</View>
									</View>
								),
							)}
						</GlassView>
					) : (
						<View style={styles.emptyState}>
							<Text style={styles.emptyStateText}>
								You don't have any custom fields.
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
							{Platform.OS === 'ios' ? (
								<SymbolView
									name="plus.circle.fill"
									size={20}
									type="hierarchical"
									tintColor={
										(settings?.customFields?.length ?? 0) >= 4
											? colors.textDisabled
											: colors.primary
									}
								/>
							) : (
								<MaterialCommunityIcons
									name="plus-circle"
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
									styles.addFieldButtonText,
									(settings?.customFields?.length ?? 0) >= 4 &&
										styles.addFieldButtonTextDisabled,
								]}
							>
								Add Field
							</Text>
						</TouchableOpacity>
					</GlassView>
				</ScrollView>
			</KeyboardAvoidingView>

			{/* Add Custom Field Modal */}
			<Modal
				visible={modalVisible}
				transparent
				animationType="none"
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
		...Platform.select({
			ios: isIPad()
				? {
						paddingHorizontal: spacing.xxl * 2,
					}
				: {},
		}),
	},
	backButtonContainer: {
		width: 50,
	},
	liquidGlassButtonCircular: {
		width: 40,
		height: 40,
		borderRadius: 20,
		overflow: 'hidden',
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.25,
				shadowRadius: 4,
			},
			android: {
				elevation: 4,
			},
		}),
	},
	circularButton: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerTitle: {
		...typography.largeTitle,
		color: colors.text,
		flex: 1,
		textAlign: 'center',
	},
	headerSpacer: {
		width: 50,
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
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		minHeight: 44,
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
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacing.xs,
		paddingVertical: spacing.md,
		minHeight: 52,
	},
	addFieldButtonText: {
		...typography.body,
		color: colors.primary,
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
