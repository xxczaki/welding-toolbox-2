/**
 * Heat Input Calculator - Android Jetpack Compose Implementation
 * Uses native Jetpack Compose components for Material 3 feel
 */

import { AlertDialog, Picker, size } from '@expo/ui/jetpack-compose';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
	Keyboard,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from 'react-native';

import {
	EFFICIENCY_FACTOR_OPTIONS,
	getEfficiencyLabel,
} from '../../constants/heat-input';
import { useARMeasurement } from '../../hooks/useARMeasurement';
import { useHeatInputCalculation } from '../../hooks/useHeatInputCalculation';
import { createHistoryEntry } from '../../hooks/useHistoryEntry';
import { useSettings } from '../../hooks/useSettings';
import { useTimerWithLiveActivity } from '../../hooks/useTimerWithLiveActivity';
import {
	borderRadius,
	colors,
	commonStyles,
	spacing,
	typography,
} from '../../theme';

const HeatInputScreen = () => {
	const router = useRouter();
	const { settings, updateSettings } = useSettings();
	const scrollViewRef = useRef<ScrollView>(null);

	// Form state
	const [amperage, setAmperage] = useState('');
	const [voltage, setVoltage] = useState('');
	const [length, setLength] = useState('');
	const [totalEnergy, setTotalEnergy] = useState('');
	const [efficiencyFactor, setEfficiencyFactor] = useState('');
	const [isDiameter, setDiameter] = useState(false);
	const [customFieldValues, setCustomFieldValues] = useState<
		Record<string, string>
	>({});
	const [saveDialogVisible, setSaveDialogVisible] = useState(false);
	const [noResultDialogVisible, setNoResultDialogVisible] = useState(false);
	const [efficiencyPickerVisible, setEfficiencyPickerVisible] = useState(false);

	// Refs for keyboard navigation
	const amperageRef = useRef<TextInput>(null);
	const voltageRef = useRef<TextInput>(null);
	const lengthRef = useRef<TextInput>(null);
	const timeRef = useRef<TextInput>(null);
	const totalEnergyRef = useRef<TextInput>(null);
	const customFieldRefs = useRef<Record<string, TextInput | null>>({});

	const {
		time,
		isRunning,
		hasTimerValue,
		handleStartStop,
		handleStopTimer,
		handleTimeChange,
		resetTimer,
	} = useTimerWithLiveActivity();

	const lengthUnit = settings?.lengthImperial ? 'in' : 'mm';
	const { isSupported: isARSupported, measure: handleARMeasurement } =
		useARMeasurement({
			unit: lengthUnit,
			onMeasurement: (distance) => setLength(distance),
		});

	const { calculatedResult, calculatedTravelSpeed } = useHeatInputCalculation({
		amperage,
		voltage,
		length,
		time,
		efficiencyFactor,
		totalEnergy,
		isDiameter,
		settings,
	});

	const handleSavePress = useCallback(() => {
		if (!settings) return;

		const historyEntry = createHistoryEntry({
			amperage,
			voltage,
			length,
			totalEnergy,
			time,
			efficiencyFactor,
			calculatedResult,
			calculatedTravelSpeed,
			customFieldValues,
			settings,
		});

		if (!historyEntry) {
			setNoResultDialogVisible(true);
			return;
		}

		updateSettings({
			resultHistory: [historyEntry, ...(settings?.resultHistory || [])],
		});

		setSaveDialogVisible(true);
	}, [
		calculatedResult,
		calculatedTravelSpeed,
		amperage,
		voltage,
		length,
		totalEnergy,
		time,
		efficiencyFactor,
		customFieldValues,
		settings,
		updateSettings,
	]);

	const resetForm = useCallback(() => {
		setAmperage('');
		setVoltage('');
		setLength('');
		setTotalEnergy('');
		setEfficiencyFactor('');
		setDiameter(false);
		setCustomFieldValues({});
		resetTimer();
	}, [resetTimer]);

	const hasInputs =
		amperage ||
		voltage ||
		length ||
		totalEnergy ||
		efficiencyFactor ||
		time ||
		Object.values(customFieldValues).some((v) => v);

	const handleCopyResult = useCallback(() => {
		if (calculatedResult > 0) {
			Clipboard.setStringAsync(
				`${calculatedResult} kJ/${settings?.resultUnit || 'mm'}`,
			);
		}
	}, [calculatedResult, settings?.resultUnit]);

	return (
		<View style={styles.container}>
			{/* Header */}
			<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
				<View style={styles.header}>
					<Text style={styles.headerTitle}>Heat Input</Text>
					<View style={styles.headerActions}>
						<TouchableOpacity
							onPress={() => router.push('/(heat-input)/history')}
							style={styles.headerIconButton}
						>
							<MaterialCommunityIcons
								name="history"
								size={20}
								color={colors.text}
							/>
						</TouchableOpacity>
						{/* Note: Native Button from @expo/ui/jetpack-compose cuts off text regardless of size modifiers or wrapper Views */}
						<TouchableOpacity
							onPress={resetForm}
							style={[
								styles.headerTextButton,
								!hasInputs && styles.headerTextButtonDisabled,
							]}
							disabled={!hasInputs}
						>
							<Text
								style={[
									styles.headerTextButtonLabel,
									!hasInputs && styles.headerTextButtonLabelDisabled,
								]}
							>
								Clear
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</TouchableWithoutFeedback>

			{/* Result Card */}
			<View style={styles.resultCard}>
				<View style={styles.resultRow}>
					<View style={styles.resultValueContainer}>
						<Text
							style={[
								styles.resultValue,
								calculatedResult <= 0 && styles.resultValuePlaceholder,
							]}
						>
							{calculatedResult > 0 ? `${calculatedResult}` : '—'}
						</Text>
						<Text style={styles.resultUnit}>
							{` kJ/${settings?.resultUnit || 'mm'}`}
						</Text>
					</View>
					<View style={styles.resultActions}>
						<TouchableOpacity
							onPress={handleCopyResult}
							style={[
								styles.resultIconButton,
								calculatedResult <= 0 && styles.resultIconButtonDisabled,
							]}
							disabled={calculatedResult <= 0}
						>
							<MaterialCommunityIcons
								name="content-copy"
								size={20}
								color={calculatedResult > 0 ? colors.text : colors.textDisabled}
							/>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={handleSavePress}
							style={[
								styles.resultIconButton,
								calculatedResult <= 0 && styles.resultIconButtonDisabled,
							]}
							disabled={calculatedResult <= 0}
						>
							<MaterialCommunityIcons
								name="tray-arrow-down"
								size={20}
								color={
									calculatedResult > 0 ? colors.primary : colors.textDisabled
								}
							/>
						</TouchableOpacity>
					</View>
				</View>
				{!settings?.totalEnergy && (
					<View style={styles.travelSpeedRow}>
						<Text style={styles.travelSpeedLabel}>Travel Speed: </Text>
						<Text
							style={[
								styles.travelSpeedValue,
								calculatedTravelSpeed <= 0 &&
									styles.travelSpeedValuePlaceholder,
							]}
						>
							{calculatedTravelSpeed > 0 ? `${calculatedTravelSpeed}` : '—'}
						</Text>
						<Text style={styles.travelSpeedUnit}>
							{` ${settings?.travelSpeedUnit || 'mm/min'}`}
						</Text>
					</View>
				)}
			</View>

			<ScrollView
				ref={scrollViewRef}
				contentContainerStyle={[
					styles.scrollContent,
					{
						paddingBottom: 350,
					},
				]}
				keyboardShouldPersistTaps="handled"
			>
				{/* Amperage & Voltage */}
				{!settings?.totalEnergy && (
					<View style={styles.row}>
						<View style={styles.inputGroup}>
							<Text style={styles.inputLabel}>Amperage</Text>
							<View style={styles.inputWithUnit}>
								<TextInput
									ref={amperageRef}
									style={styles.input}
									value={amperage}
									onChangeText={setAmperage}
									keyboardType="decimal-pad"
									placeholder="0"
									placeholderTextColor={colors.textSecondary}
									returnKeyType="next"
									onSubmitEditing={() => voltageRef.current?.focus()}
								/>
								<Text style={styles.unitText}>A</Text>
							</View>
						</View>
						<View style={styles.inputGroup}>
							<Text style={styles.inputLabel}>Voltage</Text>
							<View style={styles.inputWithUnit}>
								<TextInput
									ref={voltageRef}
									style={styles.input}
									value={voltage}
									onChangeText={setVoltage}
									keyboardType="decimal-pad"
									placeholder="0"
									placeholderTextColor={colors.textSecondary}
									returnKeyType="next"
									onSubmitEditing={() => lengthRef.current?.focus()}
								/>
								<Text style={styles.unitText}>V</Text>
							</View>
						</View>
					</View>
				)}

				{/* Length/Diameter & Time/Total Energy */}
				<View style={styles.row}>
					<View style={styles.inputGroup}>
						<Text style={styles.inputLabel}>
							{isDiameter ? 'Diameter' : 'Length'}
						</Text>
						<View style={styles.inputWithUnit}>
							<TextInput
								ref={lengthRef}
								style={styles.input}
								value={length}
								onChangeText={setLength}
								keyboardType="decimal-pad"
								placeholder="0"
								placeholderTextColor={colors.textSecondary}
								returnKeyType="next"
								onSubmitEditing={() =>
									settings?.totalEnergy
										? totalEnergyRef.current?.focus()
										: timeRef.current?.focus()
								}
							/>
							<Text style={styles.unitText}>{lengthUnit}</Text>
							{isARSupported && (
								<TouchableOpacity
									onPress={handleARMeasurement}
									style={styles.arButton}
								>
									<MaterialCommunityIcons
										name="cube-scan"
										size={18}
										color={colors.primary}
									/>
								</TouchableOpacity>
							)}
						</View>
					</View>
					<View style={styles.inputGroup}>
						<Text style={styles.inputLabel}>
							{settings?.totalEnergy ? 'Total Energy' : 'Time'}
						</Text>
						<View style={styles.inputWithUnit}>
							{settings?.totalEnergy ? (
								<>
									<TextInput
										ref={totalEnergyRef}
										style={styles.input}
										value={totalEnergy}
										onChangeText={setTotalEnergy}
										keyboardType="decimal-pad"
										placeholder="0"
										placeholderTextColor={colors.textSecondary}
										returnKeyType="done"
									/>
									<Text style={styles.unitText}>kJ</Text>
								</>
							) : (
								<TextInput
									ref={timeRef}
									style={styles.input}
									value={time}
									onChangeText={handleTimeChange}
									placeholder="HH:MM:SS"
									placeholderTextColor={colors.textSecondary}
									keyboardType="numbers-and-punctuation"
									returnKeyType="next"
									onSubmitEditing={() => {
										Keyboard.dismiss();
										setEfficiencyPickerVisible(true);
									}}
								/>
							)}
						</View>
					</View>
				</View>

				{/* Controls Row */}
				<View style={styles.controlsRow}>
					<View style={styles.inputGroup}>
						<Picker
							options={['Length', 'Diameter']}
							selectedIndex={isDiameter ? 1 : 0}
							onOptionSelected={({ nativeEvent: { index } }) =>
								setDiameter(index === 1)
							}
							variant="segmented"
							elementColors={{
								activeContainerColor: colors.primary,
								activeContentColor: '#000000',
								inactiveContainerColor: colors.surfaceVariant,
								inactiveContentColor: colors.textSecondary,
							}}
							modifiers={[size(185, 45)]}
						/>
					</View>
					<View style={styles.inputGroup}>
						{!settings?.totalEnergy && (
							<View style={styles.timerButtonRow}>
								<TouchableOpacity
									style={styles.timerButton}
									onPress={handleStartStop}
									activeOpacity={0.7}
								>
									<MaterialCommunityIcons
										name={
											isRunning
												? 'pause'
												: hasTimerValue
													? 'play'
													: 'timer-outline'
										}
										size={16}
										color={colors.primary}
									/>
									<Text style={styles.timerButtonText}>
										{isRunning
											? 'Pause'
											: hasTimerValue
												? 'Resume'
												: 'Start Timer'}
									</Text>
								</TouchableOpacity>
								{(isRunning || hasTimerValue) && (
									<TouchableOpacity
										style={styles.timerStopButton}
										onPress={handleStopTimer}
										activeOpacity={0.7}
									>
										<MaterialCommunityIcons
											name="stop"
											size={16}
											color={colors.text}
										/>
										<Text style={styles.timerStopButtonText}>Stop</Text>
									</TouchableOpacity>
								)}
							</View>
						)}
					</View>
				</View>

				{/* Efficiency Factor */}
				{!settings?.totalEnergy && (
					<View style={styles.efficiencySection}>
						<Text style={styles.sectionLabel}>Efficiency Factor</Text>
						<TouchableOpacity
							style={styles.selectButton}
							onPress={() => setEfficiencyPickerVisible(true)}
							activeOpacity={0.7}
						>
							<Text
								style={[
									styles.selectButtonText,
									!efficiencyFactor && styles.selectButtonPlaceholder,
								]}
							>
								{getEfficiencyLabel(efficiencyFactor)}
							</Text>
							<MaterialCommunityIcons
								name="chevron-down"
								size={20}
								color={colors.textSecondary}
							/>
						</TouchableOpacity>
					</View>
				)}

				{/* Custom Fields */}
				{settings?.customFields &&
					settings.customFields.length > 0 &&
					settings.customFields.map((field, index, arr) => {
						const isLastField = index === arr.length - 1;
						const nextField = arr[index + 1];
						return (
							<View key={field.timestamp} style={styles.customFieldRow}>
								<Text style={styles.inputLabel}>
									{field.name}
									{field.unit && (
										<Text style={styles.customFieldUnit}> ({field.unit})</Text>
									)}
								</Text>
								<View style={styles.inputWithUnit}>
									<TextInput
										ref={(ref) => {
											customFieldRefs.current[field.name] = ref;
										}}
										style={styles.input}
										value={customFieldValues[field.name] || ''}
										onChangeText={(value) =>
											setCustomFieldValues((prev) => ({
												...prev,
												[field.name]: value,
											}))
										}
										placeholder="Enter value…"
										placeholderTextColor={colors.textSecondary}
										returnKeyType={isLastField ? 'done' : 'next'}
										onSubmitEditing={() => {
											if (isLastField) {
												Keyboard.dismiss();
											} else {
												customFieldRefs.current[nextField.name]?.focus();
											}
										}}
									/>
								</View>
							</View>
						);
					})}
			</ScrollView>

			{/* Save Success Dialog */}
			<AlertDialog
				title="Saved"
				text="Result saved to history"
				visible={saveDialogVisible}
				onDismissPressed={() => setSaveDialogVisible(false)}
				onConfirmPressed={() => setSaveDialogVisible(false)}
				confirmButtonText="OK"
				dismissButtonText=""
			/>

			{/* No Result Dialog */}
			<AlertDialog
				title="No Result"
				text="Please enter values to calculate before saving."
				visible={noResultDialogVisible}
				onDismissPressed={() => setNoResultDialogVisible(false)}
				onConfirmPressed={() => setNoResultDialogVisible(false)}
				confirmButtonText="OK"
				dismissButtonText=""
			/>

			{/* Efficiency Factor Picker */}
			<Modal
				visible={efficiencyPickerVisible}
				transparent
				animationType="fade"
				onRequestClose={() => setEfficiencyPickerVisible(false)}
			>
				<Pressable
					style={styles.modalOverlay}
					onPress={() => setEfficiencyPickerVisible(false)}
				>
					<View style={styles.bottomSheetContent}>
						<Text style={styles.bottomSheetTitle}>Efficiency Factor</Text>
						{EFFICIENCY_FACTOR_OPTIONS.map((option) => (
							<TouchableOpacity
								key={option.value}
								style={[
									styles.bottomSheetOption,
									efficiencyFactor === option.value &&
										styles.bottomSheetOptionSelected,
								]}
								onPress={() => {
									setEfficiencyFactor(option.value);
									setEfficiencyPickerVisible(false);
									// Focus first custom field if available
									const firstCustomField = settings?.customFields?.[0];
									if (firstCustomField) {
										setTimeout(() => {
											customFieldRefs.current[firstCustomField.name]?.focus();
										}, 100);
									}
								}}
							>
								<Text
									style={[
										styles.bottomSheetOptionText,
										efficiencyFactor === option.value &&
											styles.bottomSheetOptionTextSelected,
									]}
								>
									{option.label}
								</Text>
								{efficiencyFactor === option.value && (
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
	headerActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
	},
	headerIconButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: colors.surfaceVariant,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerTextButton: {
		height: 36,
		paddingHorizontal: spacing.md,
		borderRadius: 18,
		backgroundColor: colors.surfaceVariant,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerTextButtonDisabled: {
		opacity: 0.5,
	},
	headerTextButtonLabel: {
		...typography.subheadline,
		color: colors.text,
		fontWeight: '500',
	},
	headerTextButtonLabelDisabled: {
		color: colors.textDisabled,
	},
	resultCard: {
		marginHorizontal: spacing.md,
		marginTop: spacing.md,
		padding: spacing.md,
		backgroundColor: colors.surface,
		borderRadius: borderRadius.xl,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
	},
	resultRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	resultValueContainer: {
		flexDirection: 'row',
		alignItems: 'baseline',
	},
	resultValue: {
		fontSize: 40,
		fontWeight: 'bold',
		color: colors.primary,
	},
	resultValuePlaceholder: {
		color: colors.textSecondary,
	},
	resultUnit: {
		...typography.body,
		color: colors.textSecondary,
	},
	resultActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
	},
	resultIconButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: colors.surfaceVariant,
		alignItems: 'center',
		justifyContent: 'center',
	},
	resultIconButtonDisabled: {
		opacity: 0.5,
	},
	travelSpeedRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: spacing.sm,
	},
	travelSpeedLabel: {
		...typography.footnote,
		color: colors.textSecondary,
	},
	travelSpeedValue: {
		...typography.footnote,
		color: colors.text,
		fontWeight: 'bold',
	},
	travelSpeedValuePlaceholder: {
		color: colors.textSecondary,
	},
	travelSpeedUnit: {
		...typography.footnote,
		color: colors.textSecondary,
	},
	scrollContent: {
		paddingTop: spacing.md,
		paddingHorizontal: spacing.md,
		gap: spacing.md,
	},
	section: {
		marginBottom: spacing.lg,
	},
	efficiencySection: {
		// No extra margin - gap handles spacing
	},
	sectionLabel: {
		...typography.footnote,
		color: colors.textSecondary,
		marginBottom: spacing.sm,
	},
	row: {
		flexDirection: 'row',
		gap: spacing.sm,
	},
	controlsRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
	},
	inputGroup: {
		flex: 1,
	},
	inputLabel: {
		...typography.caption1,
		color: colors.textSecondary,
		marginBottom: spacing.xs,
	},
	inputWithUnit: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: colors.surfaceVariant,
		borderRadius: borderRadius.round,
		paddingHorizontal: spacing.md,
		minHeight: 48,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
	},
	input: {
		flex: 1,
		...typography.body,
		color: colors.text,
		paddingVertical: spacing.sm,
	},
	unitText: {
		...typography.body,
		color: colors.textSecondary,
		fontWeight: '500',
	},
	arButton: {
		marginLeft: spacing.sm,
		padding: spacing.xs,
	},
	timerButtonRow: {
		flexDirection: 'row',
		gap: spacing.xs,
	},
	timerButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacing.xs,
		backgroundColor: colors.surfaceVariant,
		borderRadius: borderRadius.round,
		height: 43,
		paddingHorizontal: spacing.sm,
	},
	timerButtonText: {
		...typography.subheadline,
		color: colors.primary,
		fontWeight: '500',
	},
	timerStopButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacing.xs,
		backgroundColor: colors.surfaceVariant,
		borderRadius: borderRadius.round,
		height: 43,
		paddingHorizontal: spacing.sm,
	},
	timerStopButtonText: {
		...typography.subheadline,
		color: colors.text,
		fontWeight: '500',
	},
	selectButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: colors.surfaceVariant,
		borderRadius: borderRadius.round,
		paddingHorizontal: spacing.md,
		minHeight: 48,
	},
	selectButtonText: {
		...typography.body,
		color: colors.text,
		flex: 1,
	},
	selectButtonPlaceholder: {
		color: colors.textSecondary,
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
	customFieldRow: {
		// Spacing handled by scrollContent gap
	},
	customFieldUnit: {
		color: colors.textSecondary,
	},
});

export default HeatInputScreen;
