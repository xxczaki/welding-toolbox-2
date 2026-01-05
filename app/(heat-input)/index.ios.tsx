import {
	Button,
	Host,
	HStack,
	Picker,
	Spacer,
	Image as SwiftImage,
	Text,
	VStack,
} from '@expo/ui/swift-ui';
import {
	cornerRadius,
	frame,
	glassEffect,
	layoutPriority,
	padding,
} from '@expo/ui/swift-ui/modifiers';
import { useRouter } from 'expo-router';
import { nanoid } from 'nanoid/non-secure';
import { useCallback, useRef, useState } from 'react';
import {
	ActionSheetIOS,
	Alert,
	Dimensions,
	Keyboard,
	Text as RNText,
	ScrollView,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
	EFFICIENCY_FACTOR_OPTIONS,
	getEfficiencyLabel,
} from '../../constants/heat-input';
import { useARMeasurement } from '../../hooks/useARMeasurement';
import { useHeatInputCalculation } from '../../hooks/useHeatInputCalculation';
import { useSettings } from '../../hooks/useSettings';
import { useTimerWithLiveActivity } from '../../hooks/useTimerWithLiveActivity';
import { borderRadius, colors, spacing } from '../../theme';
import type { HistoryEntry } from '../../types';
import { parseDecimal } from '../../utils/parse-decimal';
import { toSeconds } from '../../utils/to-seconds';

const HeatInputScreen = () => {
	const router = useRouter();
	const insets = useSafeAreaInsets();
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

	// Refs for keyboard navigation
	const amperageRef = useRef<TextInput>(null);
	const voltageRef = useRef<TextInput>(null);
	const lengthRef = useRef<TextInput>(null);
	const timeRef = useRef<TextInput>(null);
	const totalEnergyRef = useRef<TextInput>(null);

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

	// Calculation hook
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

	const saveToHistory = useCallback(() => {
		if (calculatedResult === 0) {
			Alert.alert(
				'No Result',
				'Please enter values to calculate before saving.',
			);
			return;
		}

		const custom: Record<string, string>[] =
			settings?.customFields?.map((element) => ({
				[element.name]: customFieldValues[element.name] || 'N/A',
			})) || [];

		const travelSpeedFormatted =
			calculatedTravelSpeed > 0
				? `${calculatedTravelSpeed} ${settings?.travelSpeedUnit || 'mm/min'}`
				: 'N/A';

		const historyEntry: HistoryEntry = Object.assign(
			{
				id: nanoid(),
				Date: new Date().toISOString(),
				Amperage: parseDecimal(amperage) || 'N/A',
				Voltage: parseDecimal(voltage) || 'N/A',
				'Total energy': parseDecimal(totalEnergy)
					? `${parseDecimal(totalEnergy)} kJ`
					: 'N/A',
				Length: `${parseDecimal(length)} ${settings?.lengthImperial ? 'in' : 'mm'}`,
				Time: time ? `${toSeconds(time.toString())}s` : 'N/A',
				'Efficiency factor': parseDecimal(efficiencyFactor) || 'N/A',
				'Heat Input': `${calculatedResult} kJ/${settings?.resultUnit || 'mm'}`,
				'Travel Speed': travelSpeedFormatted,
			},
			...custom,
		) as HistoryEntry;

		updateSettings({
			resultHistory: [historyEntry, ...(settings?.resultHistory || [])],
		});

		Alert.alert('Saved', 'Result saved to history');
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

	const showEfficiencyPicker = () => {
		ActionSheetIOS.showActionSheetWithOptions(
			{
				options: ['Cancel', ...EFFICIENCY_FACTOR_OPTIONS.map((o) => o.label)],
				cancelButtonIndex: 0,
			},
			(buttonIndex) => {
				if (buttonIndex > 0) {
					setEfficiencyFactor(EFFICIENCY_FACTOR_OPTIONS[buttonIndex - 1].value);
				}
			},
		);
	};

	return (
		<View style={styles.container}>
			{/* Header with Glass Buttons */}
			<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
				<View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
					<RNText style={styles.headerTitle}>Heat Input</RNText>
					<View style={{ flexDirection: 'row', gap: 8 }}>
						<Host matchContents>
							<Button
								systemImage="clock.arrow.circlepath"
								onPress={() => router.push('/(heat-input)/history')}
								color="white"
								modifiers={[
									frame({ width: 36, height: 36 }),
									glassEffect({ shape: 'circle' }),
								]}
							/>
						</Host>
						<Host style={{ width: 70, height: 36 }}>
							<Button onPress={resetForm} variant="glass" disabled={!hasInputs}>
								<Text size={18}>Clear</Text>
							</Button>
						</Host>
					</View>
				</View>
			</TouchableWithoutFeedback>

			{/* Result Card with Glass Effect */}
			<View style={styles.resultCardWrapper}>
				<Host matchContents>
					<VStack
						alignment="leading"
						spacing={4}
						modifiers={[
							padding({ horizontal: 16, vertical: 14 }),
							glassEffect({
								glass: { variant: 'regular' },
							}),
							cornerRadius(20),
						]}
					>
						<HStack alignment="center" spacing={4}>
							<HStack
								alignment="firstTextBaseline"
								spacing={4}
								modifiers={[padding({ leading: 12 })]}
							>
								<Text
									size={40}
									weight="bold"
									color={calculatedResult > 0 ? '#ff9800' : 'secondary'}
								>
									{calculatedResult > 0 ? `${calculatedResult}` : '—'}
								</Text>
								<Text size={17} color="secondary">
									{`kJ/${settings?.resultUnit || 'mm'}`}
								</Text>
							</HStack>
							<Spacer />
							<HStack spacing={8} modifiers={[padding({ trailing: 12 })]}>
								<Button
									systemImage="doc.on.doc"
									color="white"
									disabled={calculatedResult <= 0}
									onPress={() => {
										// Copy to clipboard
									}}
									modifiers={[
										frame({ width: 36, height: 36 }),
										glassEffect({ shape: 'circle' }),
									]}
								/>
								<Button
									systemImage="arrow.down.document"
									color="#ff9800"
									disabled={calculatedResult <= 0}
									onPress={saveToHistory}
									modifiers={[
										frame({ width: 36, height: 36 }),
										glassEffect({ shape: 'circle' }),
									]}
								/>
							</HStack>
						</HStack>
						{!settings?.totalEnergy && (
							<HStack spacing={0} modifiers={[padding({ leading: 12 })]}>
								<Text size={13} color="secondary">
									{'Travel Speed: '}
								</Text>
								<Text
									size={13}
									color={calculatedTravelSpeed > 0 ? 'white' : 'secondary'}
									weight="bold"
								>
									{calculatedTravelSpeed > 0 ? `${calculatedTravelSpeed}` : '—'}
								</Text>
								<Text size={13} color="secondary">
									{` ${settings?.travelSpeedUnit || 'mm/min'}`}
								</Text>
							</HStack>
						)}
					</VStack>
				</Host>
			</View>

			<ScrollView
				ref={scrollViewRef}
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingBottom: insets.bottom + 100 },
				]}
				keyboardShouldPersistTaps="handled"
			>
				{/* Amperage & Voltage Row */}
				{!settings?.totalEnergy && (
					<View style={styles.row}>
						<View style={styles.inputGroup}>
							<RNText style={styles.inputLabel}>Amperage</RNText>
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
								<RNText style={styles.unitText}>A</RNText>
							</View>
						</View>
						<View style={styles.inputGroup}>
							<RNText style={styles.inputLabel}>Voltage</RNText>
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
								<RNText style={styles.unitText}>V</RNText>
							</View>
						</View>
					</View>
				)}

				{/* Length & Time Row */}
				<View style={[styles.row, { marginBottom: spacing.sm }]}>
					<View style={styles.inputGroup}>
						<RNText style={styles.inputLabel}>
							{isDiameter ? 'Diameter' : 'Length'}
						</RNText>
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
							<RNText style={styles.unitText}>{lengthUnit}</RNText>
							{isARSupported && (
								<Host
									matchContents
									style={{ marginLeft: spacing.xs, marginRight: -spacing.sm }}
								>
									<Button
										systemImage="cube.transparent"
										onPress={handleARMeasurement}
										color="#ff9800"
										modifiers={[
											frame({ width: 36, height: 36 }),
											glassEffect({ shape: 'circle' }),
										]}
									/>
								</Host>
							)}
						</View>
					</View>
					<View style={styles.inputGroup}>
						<RNText style={styles.inputLabel}>
							{settings?.totalEnergy ? 'Total Energy' : 'Time'}
						</RNText>
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
									<RNText style={styles.unitText}>kJ</RNText>
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
										showEfficiencyPicker();
									}}
								/>
							)}
						</View>
					</View>
				</View>

				{/* Length/Diameter Toggle & Timer Controls */}
				<View style={styles.controlsRow}>
					<View style={styles.segmentedWrapper}>
						<Host style={{ flex: 1 }}>
							<Picker
								variant="segmented"
								options={['Length', 'Diameter']}
								selectedIndex={isDiameter ? 1 : 0}
								onOptionSelected={({ nativeEvent: { index } }) =>
									setDiameter(index === 1)
								}
							/>
						</Host>
					</View>
					{!settings?.totalEnergy && (
						<View style={styles.timerButtonWrapper}>
							<Host style={{ flex: 1 }}>
								<HStack spacing={spacing.sm}>
									<Button onPress={handleStartStop} variant="glass">
										<HStack
											alignment="center"
											modifiers={[frame({ height: 20 }), layoutPriority(1)]}
										>
											<Spacer />
											<HStack spacing={5} alignment="center">
												<SwiftImage
													systemName={
														isRunning
															? 'pause.fill'
															: hasTimerValue
																? 'play.fill'
																: 'timer'
													}
													size={10}
													color="#ff9800"
												/>
												<Text color="#ff9800" size={13}>
													{isRunning
														? 'Pause'
														: hasTimerValue
															? 'Resume'
															: 'Start Timer'}
												</Text>
											</HStack>
											<Spacer />
										</HStack>
									</Button>
									{(isRunning || hasTimerValue) && (
										<Button onPress={handleStopTimer} variant="glass">
											<HStack
												spacing={5}
												alignment="center"
												modifiers={[frame({ height: 20 })]}
											>
												<SwiftImage systemName="stop.fill" size={10} />
												<Text size={13}>Stop</Text>
											</HStack>
										</Button>
									)}
								</HStack>
							</Host>
						</View>
					)}
				</View>

				{/* Efficiency Factor */}
				{!settings?.totalEnergy && (
					<View style={styles.section}>
						<RNText style={styles.sectionTitle}>Efficiency Factor</RNText>
						<TouchableOpacity
							style={styles.selectButton}
							onPress={showEfficiencyPicker}
							activeOpacity={0.7}
						>
							<RNText
								style={[
									styles.selectButtonText,
									!efficiencyFactor && styles.selectButtonPlaceholder,
								]}
							>
								{getEfficiencyLabel(efficiencyFactor)}
							</RNText>
							<Host matchContents>
								<SwiftImage
									systemName="chevron.down"
									size={14}
									color="secondary"
								/>
							</Host>
						</TouchableOpacity>
					</View>
				)}

				{/* Custom Fields */}
				{settings?.customFields &&
					settings.customFields.length > 0 &&
					settings.customFields.map((field) => (
						<View key={field.timestamp} style={styles.customFieldRow}>
							<RNText style={styles.inputLabel}>
								{field.name}
								{field.unit && (
									<RNText style={styles.inputLabel}> ({field.unit})</RNText>
								)}
							</RNText>
							<View style={styles.inputWithUnit}>
								<TextInput
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
								/>
							</View>
						</View>
					))}
			</ScrollView>
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
		paddingBottom: spacing.md,
	},
	headerTitle: {
		fontSize: 34,
		fontWeight: 'bold',
		color: colors.text,
	},
	resultCardWrapper: {
		marginHorizontal: spacing.md,
		marginBottom: spacing.md,
	},
	scrollContent: {
		paddingHorizontal: spacing.md,
	},
	row: {
		flexDirection: 'row',
		gap: spacing.sm,
		marginBottom: spacing.md,
	},
	inputGroup: {
		flex: 1,
	},
	inputLabel: {
		fontSize: 13,
		color: colors.textSecondary,
		marginBottom: spacing.xs,
	},
	inputWithUnit: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: colors.surfaceVariant,
		borderRadius: borderRadius.lg,
		paddingHorizontal: spacing.md,
		minHeight: 48,
	},
	input: {
		flex: 1,
		fontSize: 17,
		color: colors.text,
		paddingVertical: spacing.sm,
	},
	unitText: {
		fontSize: 17,
		color: colors.textSecondary,
		fontWeight: '500',
		marginLeft: spacing.xs,
	},
	controlsRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		marginBottom: spacing.md,
	},
	segmentedWrapper: {
		width: (Dimensions.get('window').width - spacing.md * 2 - spacing.sm) / 2,
		height: 36,
	},
	timerButtonWrapper: {
		flex: 1,
	},
	section: {
		marginBottom: spacing.lg,
	},
	sectionTitle: {
		fontSize: 13,
		color: colors.textSecondary,
		marginBottom: spacing.sm,
	},
	customFieldRow: {
		marginBottom: spacing.md,
	},
	selectButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: colors.surfaceVariant,
		borderRadius: borderRadius.lg,
		paddingHorizontal: spacing.md,
		minHeight: 48,
	},
	selectButtonText: {
		fontSize: 17,
		color: colors.text,
		flex: 1,
	},
	selectButtonPlaceholder: {
		color: colors.textSecondary,
	},
});

export default HeatInputScreen;
