import { AlertDialog } from '@expo/ui/jetpack-compose';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	KeyboardAvoidingView,
	Modal,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import DraggableFlatList, {
	type RenderItemParams,
	ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useExportFieldsManagement } from '../../hooks/useExportFieldsManagement';
import {
	borderRadius,
	colors,
	commonStyles,
	spacing,
	typography,
} from '../../theme';
import type { ExportField } from '../../types';

const HistoryExportScreen = () => {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [customFieldName, setCustomFieldName] = useState('');
	const [customFieldUnit, setCustomFieldUnit] = useState('');
	const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
	const [fieldToDelete, setFieldToDelete] = useState<number | null>(null);
	const fieldNameRef = useRef<TextInput>(null);
	const unitRef = useRef<TextInput>(null);

	const {
		exportFields,
		setExportFields,
		addCustomField,
		deleteCustomField,
		canAddMore,
	} = useExportFieldsManagement();

	// Auto-focus the field name input when sheet opens
	useEffect(() => {
		if (!isSheetOpen) return;

		const timer = setTimeout(() => {
			fieldNameRef.current?.focus();
		}, 100);
		return () => clearTimeout(timer);
	}, [isSheetOpen]);

	const handleAddField = () => {
		if (!customFieldName.trim()) return;

		addCustomField(customFieldName, customFieldUnit);
		setCustomFieldName('');
		setCustomFieldUnit('');
		setIsSheetOpen(false);
	};

	const handleDeletePress = useCallback((timestamp: number) => {
		setFieldToDelete(timestamp);
		setDeleteDialogVisible(true);
	}, []);

	const confirmDelete = () => {
		if (fieldToDelete !== null) {
			deleteCustomField(fieldToDelete);
		}
		setDeleteDialogVisible(false);
		setFieldToDelete(null);
	};

	const renderItem = useCallback(
		({ item, drag, isActive, getIndex }: RenderItemParams<ExportField>) => {
			const index = getIndex() ?? 0;
			const isFirst = index === 0;
			const isLast = index === exportFields.length - 1;

			return (
				<ScaleDecorator>
					<TouchableOpacity
						activeOpacity={1}
						onLongPress={drag}
						disabled={isActive}
						style={[
							styles.fieldItem,
							isFirst && styles.fieldItemFirst,
							isLast && styles.fieldItemLast,
							isActive && styles.fieldItemActive,
						]}
					>
						<TouchableOpacity onPressIn={drag} style={styles.dragHandle}>
							<MaterialCommunityIcons
								name="menu"
								size={22}
								color={colors.textSecondary}
							/>
						</TouchableOpacity>

						<View style={styles.fieldLabelContainer}>
							<Text style={styles.fieldLabel}>{item.label}</Text>
						</View>

						{item.type === 'custom' && item.customFieldTimestamp && (
							<TouchableOpacity
								onPress={() => {
									if (item.customFieldTimestamp) {
										handleDeletePress(item.customFieldTimestamp);
									}
								}}
								style={styles.deleteButton}
							>
								<MaterialCommunityIcons
									name="minus-circle"
									size={22}
									color="#ff3b30"
								/>
							</TouchableOpacity>
						)}
					</TouchableOpacity>
				</ScaleDecorator>
			);
		},
		[handleDeletePress, exportFields],
	);

	return (
		<GestureHandlerRootView style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<MaterialCommunityIcons
						name="arrow-left"
						size={24}
						color={colors.text}
					/>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>History Export</Text>
				<TouchableOpacity
					onPress={() => canAddMore && setIsSheetOpen(true)}
					style={[
						styles.headerIconButton,
						!canAddMore && styles.addButtonDisabled,
					]}
					disabled={!canAddMore}
				>
					<MaterialCommunityIcons
						name="plus"
						size={20}
						color={canAddMore ? colors.primary : colors.textDisabled}
					/>
				</TouchableOpacity>
			</View>

			{/* Column Order Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Column Order</Text>
			</View>

			<DraggableFlatList
				data={exportFields}
				onDragEnd={({ data }) => setExportFields(data)}
				keyExtractor={(item) => item.id}
				renderItem={renderItem}
				containerStyle={{ flex: 1 }}
				contentContainerStyle={[
					styles.listContent,
					{ paddingBottom: insets.bottom + 100 },
				]}
			/>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				title="Delete Field"
				text="Are you sure you want to delete this custom field?"
				visible={deleteDialogVisible}
				onDismissPressed={() => {
					setDeleteDialogVisible(false);
					setFieldToDelete(null);
				}}
				onConfirmPressed={confirmDelete}
				confirmButtonText="Delete"
				dismissButtonText="Cancel"
			/>

			{/* Add Field Modal */}
			<Modal
				visible={isSheetOpen}
				transparent
				animationType="slide"
				onRequestClose={() => {
					setIsSheetOpen(false);
					setCustomFieldName('');
					setCustomFieldUnit('');
				}}
			>
				<KeyboardAvoidingView style={styles.modalOverlay} behavior="padding">
					<TouchableOpacity
						style={styles.modalBackdrop}
						activeOpacity={1}
						onPress={() => {
							setIsSheetOpen(false);
							setCustomFieldName('');
							setCustomFieldUnit('');
						}}
					>
						<View
							style={styles.modalContent}
							onStartShouldSetResponder={() => true}
						>
							<View style={styles.sheetHeader}>
								<Text style={styles.sheetTitle}>New Custom Field</Text>
								<TouchableOpacity
									onPress={() => {
										setIsSheetOpen(false);
										setCustomFieldName('');
										setCustomFieldUnit('');
									}}
									style={styles.sheetCloseButton}
								>
									<MaterialCommunityIcons
										name="close"
										size={20}
										color={colors.text}
									/>
								</TouchableOpacity>
							</View>
							<Text style={styles.sheetDescription}>
								Custom fields do not affect heat input calculations and are used
								for tracking additional parameters in history exports.
							</Text>

							<View style={styles.inputGroup}>
								<Text style={styles.inputLabel}>Name</Text>
								<TextInput
									ref={fieldNameRef}
									style={styles.input}
									value={customFieldName}
									onChangeText={setCustomFieldName}
									placeholder="Enter field name"
									placeholderTextColor={colors.textSecondary}
									returnKeyType="next"
									onSubmitEditing={() => unitRef.current?.focus()}
								/>
							</View>

							<View style={styles.inputGroup}>
								<Text style={styles.inputLabel}>Unit (optional)</Text>
								<TextInput
									ref={unitRef}
									style={styles.input}
									value={customFieldUnit}
									onChangeText={setCustomFieldUnit}
									placeholder="e.g. mm, C, PSI"
									placeholderTextColor={colors.textSecondary}
									returnKeyType="done"
									onSubmitEditing={() => {
										if (customFieldName.trim()) {
											handleAddField();
										}
									}}
								/>
							</View>
						</View>
					</TouchableOpacity>
				</KeyboardAvoidingView>
			</Modal>
		</GestureHandlerRootView>
	);
};

const styles = StyleSheet.create({
	container: {
		...commonStyles.container,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: spacing.md,
		paddingTop: 32,
		paddingBottom: spacing.md,
		backgroundColor: colors.background,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.border,
	},
	backButton: {
		padding: spacing.xs,
		marginRight: spacing.sm,
	},
	headerTitle: {
		...typography.largeTitle,
		color: colors.text,
		flex: 1,
	},
	headerIconButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: colors.surfaceVariant,
		alignItems: 'center',
		justifyContent: 'center',
	},
	addButtonDisabled: {
		opacity: 0.4,
	},
	section: {
		paddingHorizontal: spacing.md,
		paddingTop: spacing.md,
		paddingBottom: spacing.sm,
	},
	sectionTitle: {
		...typography.title3,
		color: colors.textSecondary,
		paddingHorizontal: spacing.sm,
	},
	listContent: {
		paddingHorizontal: spacing.md,
	},
	fieldItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: spacing.sm,
		paddingRight: spacing.md,
		backgroundColor: colors.surface,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.border,
		minHeight: 56,
	},
	fieldItemFirst: {
		borderTopLeftRadius: borderRadius.lg,
		borderTopRightRadius: borderRadius.lg,
	},
	fieldItemLast: {
		borderBottomLeftRadius: borderRadius.lg,
		borderBottomRightRadius: borderRadius.lg,
		borderBottomWidth: 0,
	},
	fieldItemActive: {
		backgroundColor: colors.surfaceVariant,
		borderRadius: borderRadius.lg,
		elevation: 5,
	},
	dragHandle: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	fieldLabelContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
	},
	fieldLabel: {
		...typography.body,
		color: colors.text,
	},
	deleteButton: {
		padding: spacing.xs,
	},
	modalOverlay: {
		flex: 1,
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.75)',
		justifyContent: 'flex-end',
	},
	modalContent: {
		backgroundColor: colors.surface,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: spacing.lg,
	},
	sheetHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: spacing.xs,
	},
	sheetTitle: {
		...typography.title2,
		color: colors.text,
	},
	sheetCloseButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: colors.surfaceVariant,
		alignItems: 'center',
		justifyContent: 'center',
	},
	sheetDescription: {
		...typography.body,
		color: colors.textSecondary,
		marginBottom: spacing.lg,
		lineHeight: 20,
	},
	inputGroup: {
		marginBottom: spacing.md,
	},
	inputLabel: {
		...typography.subheadline,
		color: colors.text,
		marginBottom: spacing.sm,
		fontWeight: '600',
	},
	input: {
		backgroundColor: colors.surfaceVariant,
		borderRadius: borderRadius.round,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		minHeight: 48,
		...typography.body,
		color: colors.text,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
	},
});

export default HistoryExportScreen;
