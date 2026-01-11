import {
	BottomSheet,
	Button,
	Host,
	HStack,
	Image,
	List,
	Section,
	Spacer,
	Text,
} from '@expo/ui/swift-ui';
import {
	foregroundStyle,
	frame,
	glassEffect,
	opacity,
} from '@expo/ui/swift-ui/modifiers';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
	Alert,
	Keyboard,
	Text as RNText,
	StyleSheet,
	TextInput,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useExportFieldsManagement } from '../../hooks/useExportFieldsManagement';
import { colors, spacing } from '../../theme';

const HistoryExportScreen = () => {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [newFieldName, setNewFieldName] = useState('');
	const [newFieldUnit, setNewFieldUnit] = useState('');
	const fieldNameRef = useRef<TextInput>(null);
	const unitRef = useRef<TextInput>(null);

	const {
		exportFields,
		addCustomField,
		deleteCustomField,
		moveField,
		canAddMore,
	} = useExportFieldsManagement();

	// Auto-focus the field name input when sheet opens
	useEffect(() => {
		if (!isSheetOpen) return;

		const timer = setTimeout(() => {
			fieldNameRef.current?.focus();
		}, 50);
		return () => clearTimeout(timer);
	}, [isSheetOpen]);

	const handleAddField = () => {
		if (!newFieldName.trim()) return;

		addCustomField(newFieldName, newFieldUnit);
		setNewFieldName('');
		setNewFieldUnit('');
		setIsSheetOpen(false);
	};

	const handleDeleteField = (timestamp: number) => {
		Alert.alert(
			'Delete Field',
			'Are you sure you want to delete this custom field?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: () => deleteCustomField(timestamp),
				},
			],
		);
	};

	const handleMoveItem = (fromIndex: number, toIndex: number) => {
		moveField(fromIndex, toIndex);
	};

	return (
		<View style={styles.container}>
			{/* Header */}
			<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
				<View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
					<Host matchContents>
						<Button
							systemImage="chevron.left"
							onPress={() => router.back()}
							modifiers={[
								frame({ width: 36, height: 36 }),
								glassEffect({ shape: 'circle' }),
								foregroundStyle('white'),
							]}
						/>
					</Host>
					<RNText style={styles.headerTitle}>History Export</RNText>
					<Host matchContents>
						<Button
							systemImage="plus"
							disabled={!canAddMore}
							onPress={() => canAddMore && setIsSheetOpen(true)}
							modifiers={[
								frame({ width: 36, height: 36 }),
								glassEffect({ shape: 'circle' }),
								foregroundStyle('white'),
								...(!canAddMore ? [opacity(0.4)] : []),
							]}
						/>
					</Host>
				</View>
			</TouchableWithoutFeedback>

			{/* Fields List */}
			<Host style={[styles.listHost, { paddingBottom: insets.bottom + 90 }]}>
				<List
					listStyle="insetGrouped"
					editModeEnabled
					moveEnabled
					onMoveItem={handleMoveItem}
				>
					<Section title="Column Order">
						{exportFields.map((field) => (
							<HStack key={field.id}>
								<Text>{field.label}</Text>
								<Spacer />
								{field.type === 'custom' && field.customFieldTimestamp ? (
									<Image
										systemName="minus.circle.fill"
										size={22}
										color="red"
										onPress={() => {
											if (field.customFieldTimestamp) {
												handleDeleteField(field.customFieldTimestamp);
											}
										}}
									/>
								) : null}
							</HStack>
						))}
					</Section>
				</List>

				{/* Bottom Sheet for adding custom field */}
				<BottomSheet
					isOpened={isSheetOpen}
					onIsOpenedChange={setIsSheetOpen}
					presentationDetents={['medium']}
				>
					<View style={styles.sheetContent}>
						<View style={styles.sheetHeader}>
							<RNText style={styles.sheetTitle}>New Custom Field</RNText>
							<Host matchContents>
								<Button
									systemImage="xmark"
									onPress={() => {
										setIsSheetOpen(false);
										setNewFieldName('');
										setNewFieldUnit('');
									}}
									modifiers={[
										frame({ width: 30, height: 30 }),
										glassEffect({ shape: 'circle' }),
										foregroundStyle('white'),
									]}
								/>
							</Host>
						</View>
						<RNText style={styles.sheetDescription}>
							Custom fields do not affect heat input calculations and are used
							for tracking additional parameters in history exports. You can add
							up to 4 custom fields.
						</RNText>

						<View style={styles.inputGroup}>
							<RNText style={styles.inputLabel}>Name</RNText>
							<TextInput
								ref={fieldNameRef}
								style={styles.textInput}
								placeholder="Field name"
								placeholderTextColor={colors.textSecondary}
								value={newFieldName}
								onChangeText={setNewFieldName}
								returnKeyType="next"
								onSubmitEditing={() => unitRef.current?.focus()}
							/>
						</View>

						<View style={styles.inputGroup}>
							<RNText style={styles.inputLabel}>Unit (optional)</RNText>
							<TextInput
								ref={unitRef}
								style={styles.textInput}
								placeholder="e.g. mm, °C, PSI"
								placeholderTextColor={colors.textSecondary}
								value={newFieldUnit}
								onChangeText={setNewFieldUnit}
								returnKeyType="done"
								onSubmitEditing={() => {
									if (newFieldName.trim()) {
										handleAddField();
									}
								}}
							/>
						</View>
					</View>
				</BottomSheet>
			</Host>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: spacing.md,
		paddingBottom: spacing.sm,
	},
	headerTitle: {
		fontSize: 28,
		fontWeight: 'bold',
		color: colors.text,
	},
	listHost: {
		flex: 1,
	},
	sheetContent: {
		padding: 20,
	},
	sheetHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: spacing.xs,
	},
	sheetTitle: {
		fontSize: 22,
		fontWeight: '600',
		color: colors.text,
	},
	sheetDescription: {
		fontSize: 14,
		color: colors.textSecondary,
		marginBottom: spacing.lg,
		lineHeight: 20,
	},
	inputGroup: {
		marginBottom: spacing.md,
	},
	inputLabel: {
		fontSize: 13,
		color: colors.textSecondary,
		marginBottom: spacing.xs,
	},
	textInput: {
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
		borderRadius: 10,
		padding: 14,
		fontSize: 17,
		color: colors.text,
	},
});

export default HistoryExportScreen;
