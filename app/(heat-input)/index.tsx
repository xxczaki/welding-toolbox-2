import { MaterialCommunityIcons } from '@expo/vector-icons';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { nanoid } from 'nanoid/non-secure';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	ActionSheetIOS,
	Alert,
	Keyboard,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import { heatInput } from 'welding-utils';
import { useStopwatch } from '../../hooks/use-stopwatch';
import storage from '../../storage';
import {
	borderRadius,
	colors,
	commonStyles,
	spacing,
	typography,
} from '../../theme';
import type { HistoryEntry, Settings } from '../../types';
import { isIPad } from '../../utils/platform';
import { toSeconds } from '../../utils/to-seconds';

const HeatInputScreen = () => {
	const router = useRouter();

	// Refs for keyboard navigation
	const amperageRef = useRef<TextInput>(null);
	const voltageRef = useRef<TextInput>(null);
	const lengthRef = useRef<TextInput>(null);
	const timeRef = useRef<TextInput>(null);
	const totalEnergyRef = useRef<TextInput>(null);

	// Settings
	const [settings, setSettings] = useState<Settings>({});

	// Form state
	const [amperage, setAmperage] = useState<string>('');
	const [voltage, setVoltage] = useState<string>('');
	const [length, setLength] = useState<string>('');
	const [time, setTime] = useState<string>('');
	const [efficiencyFactor, setEfficiencyFactor] = useState<string>('');
	const [totalEnergy, setTotalEnergy] = useState<string>('');
	const [isDiameter, setDiameter] = useState<boolean>(false);

	// Stopwatch
	const { ms, start, stop, resetStopwatch, isRunning } = useStopwatch();
	const [accumulatedTime, setAccumulatedTime] = useState<number>(0);
	const [isStopped, setIsStopped] = useState<boolean>(false);
	const [timerUsed, setTimerUsed] = useState<boolean>(false);

	// Result
	const [result, setResult] = useState<number>(0);

	// Load settings on focus
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

	// Save settings when they change
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

	// Update time field when stopwatch is running
	useEffect(() => {
		if (isRunning) {
			const totalMs = ms + accumulatedTime;
			setTime(new Date(totalMs).toISOString().slice(11, -5));
		}
	}, [isRunning, ms, accumulatedTime]);

	// Auto-calculate whenever inputs change using useMemo for better performance
	// Only depend on specific settings properties to avoid unnecessary recalculations
	const calculatedResult = useMemo(() => {
		// Check if we have required inputs
		const hasTotalEnergyInputs = totalEnergy && length;
		const hasFullInputs =
			amperage && voltage && length && time && efficiencyFactor;

		if (!hasTotalEnergyInputs && !hasFullInputs) {
			return 0;
		}

		try {
			let calculatedLength = Number((length || '0').replace(/,/g, '.'));

			// Convert imperial to metric if needed
			if (settings?.lengthImperial && settings?.resultUnit !== 'in') {
				calculatedLength *= 25.4;
			}

			let result: number;

			if (settings?.totalEnergy && totalEnergy && length) {
				// Simple calculation: totalEnergy / length
				const energy = Number((totalEnergy || '0').replace(/,/g, '.'));
				result = energy / calculatedLength;
			} else if (hasFullInputs) {
				// Full heat input calculation
				const amp = Number((amperage || '0').replace(/,/g, '.'));
				const volt = Number((voltage || '0').replace(/,/g, '.'));
				const timeInSeconds = toSeconds(time.toString());
				const efficiency = Number((efficiencyFactor || '0').replace(/,/g, '.'));

				// Apply diameter conversion if needed
				if (isDiameter) {
					calculatedLength = Number((calculatedLength * Math.PI).toFixed(2));
				}

				result = heatInput({
					amperage: amp,
					voltage: volt,
					length: calculatedLength,
					time: timeInSeconds,
					efficiencyFactor: efficiency,
				});
			} else {
				return 0;
			}

			// Convert result unit if needed
			if (settings?.resultUnit === 'cm') {
				result *= 10;
			} else if (settings?.resultUnit === 'in' && !settings?.lengthImperial) {
				result *= 25.4;
			}

			if (Number.isNaN(result)) {
				return 0;
			}

			return Math.round((result + Number.EPSILON) * 1000) / 1000;
		} catch {
			return 0;
		}
	}, [
		amperage,
		voltage,
		length,
		time,
		efficiencyFactor,
		totalEnergy,
		isDiameter,
		settings?.lengthImperial,
		settings?.resultUnit,
		settings?.totalEnergy,
	]);

	// Update result state when calculation changes
	useEffect(() => {
		setResult(calculatedResult);
	}, [calculatedResult]);

	const handleStartStop = () => {
		if (isRunning) {
			// Pause: accumulate the time and reset the stopwatch
			setAccumulatedTime((prev) => prev + ms);
			stop();
			resetStopwatch();
		} else {
			// Resume/Start
			start();
			setIsStopped(false);
			setTimerUsed(true);
		}
	};

	const handleStopTimer = () => {
		stop();
		resetStopwatch();
		setAccumulatedTime(0);
		setIsStopped(true);
		setTimerUsed(false);
		// Keep the time value in the input, but reset the timer state
	};

	const handleTimeChange = (value: string) => {
		setTime(value);
		// If user manually edits time, stop and reset the timer
		if (timerUsed || isRunning) {
			stop();
			resetStopwatch();
			setAccumulatedTime(0);
			setIsStopped(true);
			setTimerUsed(false);
		}
	};

	const hasTimerValue = timerUsed && time && time !== '00:00:00' && !isStopped;

	const saveToHistory = () => {
		if (result === 0) {
			Alert.alert(
				'No Result',
				'Please enter values to calculate before saving.',
			);
			return;
		}

		const amp = Number((amperage || '0').replace(/,/g, '.'));
		const volt = Number((voltage || '0').replace(/,/g, '.'));
		const len = Number((length || '0').replace(/,/g, '.'));
		const timeInSeconds = time ? toSeconds(time.toString()) : null;
		const efficiency = Number((efficiencyFactor || '0').replace(/,/g, '.'));
		const energy = Number((totalEnergy || '0').replace(/,/g, '.'));

		const custom: Record<string, string>[] =
			settings?.customFields?.map((element) => ({
				[element.name]: 'N/A', // Custom fields would need to be implemented
			})) || [];

		const historyEntry: HistoryEntry = Object.assign(
			{
				id: nanoid(),
				Date: new Date().toLocaleString(),
				Amperage: amp || 'N/A',
				Voltage: volt || 'N/A',
				'Total energy': energy ? `${energy} kJ` : 'N/A',
				Length: `${len} ${settings?.lengthImperial ? 'in' : 'mm'}`,
				Time: timeInSeconds ? `${timeInSeconds}s` : 'N/A',
				'Efficiency factor': efficiency || 'N/A',
				'Heat Input': `${result} kJ/${settings?.resultUnit || 'mm'}`,
			},
			...custom,
		) as HistoryEntry;

		setSettings({
			...settings,
			resultHistory: [historyEntry, ...(settings?.resultHistory || [])],
		});

		Alert.alert('Saved', 'Result saved to history');
	};

	const resetForm = () => {
		setAmperage('');
		setVoltage('');
		setLength('');
		setTime('');
		setEfficiencyFactor('');
		setTotalEnergy('');
		setDiameter(false);
		resetStopwatch();
		setAccumulatedTime(0);
		setIsStopped(false);
		setTimerUsed(false);
		setResult(0);
	};

	const hasInputs =
		amperage || voltage || length || time || efficiencyFactor || totalEnergy;

	const efficiencyOptions = [
		{ label: '0.6 - 141, 15', value: '0.6' },
		{ label: '0.8 - 111, 114, 131, 135, 136, 138', value: '0.8' },
		{ label: '1.0 - 121, 122, 125', value: '1.0' },
	];

	const showEfficiencyPicker = () => {
		if (Platform.OS === 'ios') {
			ActionSheetIOS.showActionSheetWithOptions(
				{
					options: ['Cancel', ...efficiencyOptions.map((o) => o.label)],
					cancelButtonIndex: 0,
				},
				(buttonIndex) => {
					if (buttonIndex > 0) {
						setEfficiencyFactor(efficiencyOptions[buttonIndex - 1].value);
					}
				},
			);
		} else {
			// For Android, we'll keep a simple Alert
			Alert.alert('Select Efficiency Factor', '', [
				...efficiencyOptions.map((option) => ({
					text: option.label,
					onPress: () => setEfficiencyFactor(option.value),
				})),
				{ text: 'Cancel', style: 'cancel' as const },
			]);
		}
	};

	const getEfficiencyLabel = () => {
		const option = efficiencyOptions.find((o) => o.value === efficiencyFactor);
		return option ? option.label : 'Select…';
	};

	return (
		<View style={styles.container}>
			{/* Header */}
			<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
				<View style={styles.header}>
					<Text style={styles.headerTitle}>Heat Input</Text>
					<View style={styles.headerActions}>
						<GlassView
							glassEffectStyle="clear"
							style={[
								styles.liquidGlassButton,
								Platform.OS === 'android' && styles.glassButtonAndroidFallback,
							]}
						>
							<TouchableOpacity
								onPress={() => router.push('/(heat-input)/history')}
								style={styles.headerIconButton}
							>
								{Platform.OS === 'ios' ? (
									<SymbolView
										name="clock.arrow.circlepath"
										size={24}
										type="hierarchical"
										tintColor={colors.text}
										style={styles.icon}
									/>
								) : (
									<MaterialCommunityIcons
										name="history"
										size={24}
										color={colors.text}
									/>
								)}
							</TouchableOpacity>
						</GlassView>
						{hasInputs && (
							<GlassView
								glassEffectStyle="clear"
								style={[
									styles.liquidGlassButtonSquare,
									{ marginLeft: spacing.xs },
									Platform.OS === 'android' &&
										styles.glassButtonAndroidFallback,
								]}
							>
								<TouchableOpacity
									onPress={resetForm}
									style={styles.headerTextButton}
								>
									<Text style={styles.clearButtonText}>Clear</Text>
								</TouchableOpacity>
							</GlassView>
						)}
					</View>
				</View>
			</TouchableWithoutFeedback>

			{/* Result Card - Always Visible at Top */}
			<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
				<GlassView
					glassEffectStyle="clear"
					style={[
						styles.resultCard,
						Platform.OS === 'android' && styles.glassCardAndroidFallback,
					]}
				>
					<View style={styles.resultRow}>
						<View style={styles.resultContent}>
							{result === 0 ? (
								<>
									<Text style={styles.resultPlaceholder}>—</Text>
									<Text style={styles.resultUnitLabel}>
										kJ/{settings?.resultUnit || 'mm'}
									</Text>
								</>
							) : (
								<>
									<Text style={styles.resultValue}>{result}</Text>
									<Text style={styles.resultUnitLabel}>
										kJ/{settings?.resultUnit || 'mm'}
									</Text>
								</>
							)}
						</View>
						{result > 0 && (
							<View style={styles.resultActions}>
								<GlassView
									glassEffectStyle="clear"
									style={[
										styles.actionButtonGlass,
										Platform.OS === 'android' &&
											styles.glassButtonAndroidFallback,
									]}
								>
									<TouchableOpacity
										onPress={async () => {
											await Clipboard.setStringAsync(`${result}`);
										}}
										style={styles.actionButton}
									>
										{Platform.OS === 'ios' ? (
											<SymbolView
												name="doc.on.doc"
												size={20}
												type="hierarchical"
												tintColor={colors.text}
												style={styles.iconSmall}
											/>
										) : (
											<MaterialCommunityIcons
												name="content-copy"
												size={18}
												color={colors.text}
											/>
										)}
									</TouchableOpacity>
								</GlassView>
								<GlassView
									glassEffectStyle="clear"
									style={[
										styles.actionButtonGlass,
										Platform.OS === 'android' &&
											styles.glassButtonAndroidFallback,
									]}
								>
									<TouchableOpacity
										onPress={saveToHistory}
										style={styles.actionButton}
									>
										{Platform.OS === 'ios' ? (
											<SymbolView
												name="arrow.down.doc"
												size={20}
												type="hierarchical"
												tintColor={colors.primary}
												style={styles.iconSmall}
											/>
										) : (
											<MaterialCommunityIcons
												name="content-save"
												size={18}
												color={colors.primary}
											/>
										)}
									</TouchableOpacity>
								</GlassView>
							</View>
						)}
					</View>
				</GlassView>
			</TouchableWithoutFeedback>

			<ScrollView
				contentContainerStyle={[
					styles.scrollContent,
					{
						paddingBottom: Platform.OS === 'ios' ? 300 : 20,
					},
				]}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="interactive"
			>
				{/* Total Energy Mode Toggle */}
				{!settings?.totalEnergy && (
					<View style={styles.section}>
						<View style={styles.inputContainer}>
							<Text style={styles.inputLabel}>Amperage</Text>
							<View style={styles.inputWithUnit}>
								<TextInput
									ref={amperageRef}
									style={styles.inputFlex}
									value={amperage}
									onChangeText={setAmperage}
									keyboardType="decimal-pad"
									placeholder="0"
									placeholderTextColor={colors.textSecondary}
									returnKeyType="next"
									onSubmitEditing={() => voltageRef.current?.focus()}
									blurOnSubmit={false}
									accessibilityLabel="Amperage input field"
									accessibilityHint="Enter welding amperage in amps"
								/>
								<Text style={styles.unitText}>A</Text>
							</View>
						</View>

						<View style={styles.inputContainer}>
							<Text style={styles.inputLabel}>Voltage</Text>
							<View style={styles.inputWithUnit}>
								<TextInput
									ref={voltageRef}
									style={styles.inputFlex}
									value={voltage}
									onChangeText={setVoltage}
									keyboardType="decimal-pad"
									placeholder="0"
									placeholderTextColor={colors.textSecondary}
									returnKeyType="next"
									onSubmitEditing={() => lengthRef.current?.focus()}
									blurOnSubmit={false}
									accessibilityLabel="Voltage input field"
									accessibilityHint="Enter welding voltage in volts"
								/>
								<Text style={styles.unitText}>V</Text>
							</View>
						</View>
					</View>
				)}

				{/* Length Input */}
				<View style={styles.section}>
					<View style={styles.inputContainer}>
						<SegmentedControl
							values={['Length', 'Diameter']}
							selectedIndex={isDiameter ? 1 : 0}
							onChange={(event) => {
								setDiameter(event.nativeEvent.selectedSegmentIndex === 1);
							}}
							style={styles.segmentedControl}
							backgroundColor={colors.background}
							tintColor={colors.surfaceVariant}
							fontStyle={{ color: colors.textSecondary, fontSize: 15 }}
							activeFontStyle={{
								color: colors.text,
								fontSize: 15,
								fontWeight: '600',
							}}
							appearance="dark"
						/>

						<View style={styles.inputWithUnit}>
							<TextInput
								ref={lengthRef}
								style={styles.inputFlex}
								value={length}
								onChangeText={setLength}
								keyboardType="decimal-pad"
								placeholder="0"
								placeholderTextColor={colors.textSecondary}
								returnKeyType={settings?.totalEnergy ? 'next' : 'next'}
								onSubmitEditing={() => {
									if (settings?.totalEnergy) {
										totalEnergyRef.current?.focus();
									} else {
										timeRef.current?.focus();
									}
								}}
								blurOnSubmit={false}
								accessibilityLabel={`${isDiameter ? 'Diameter' : 'Length'} input field`}
								accessibilityHint={`Enter weld ${isDiameter ? 'diameter' : 'length'} in ${settings?.lengthImperial ? 'inches' : 'millimeters'}`}
							/>
							<Text style={styles.unitText}>
								{settings?.lengthImperial ? 'in' : 'mm'}
							</Text>
						</View>
					</View>
				</View>

				{/* Time or Total Energy */}
				{settings?.totalEnergy ? (
					<View style={styles.section}>
						<View style={styles.inputContainer}>
							<Text style={styles.inputLabel}>Total Energy</Text>
							<View style={styles.inputWithUnit}>
								<TextInput
									ref={totalEnergyRef}
									style={styles.inputFlex}
									value={totalEnergy}
									onChangeText={setTotalEnergy}
									keyboardType="decimal-pad"
									placeholder="0"
									placeholderTextColor={colors.textSecondary}
									returnKeyType="done"
									accessibilityLabel="Total energy input field"
									accessibilityHint="Enter total welding energy in kilojoules"
								/>
								<Text style={styles.unitText}>kJ</Text>
							</View>
						</View>
					</View>
				) : (
					<>
						<View style={styles.section}>
							<View style={styles.inputContainer}>
								<Text style={styles.inputLabel}>Time</Text>
								<View style={styles.inputWithButtons}>
									<TextInput
										ref={timeRef}
										style={styles.inputFlexTime}
										value={time}
										onChangeText={handleTimeChange}
										placeholder="HH:MM:SS"
										placeholderTextColor={colors.textSecondary}
										keyboardType="numbers-and-punctuation"
										returnKeyType="done"
										accessibilityLabel="Time input field"
										accessibilityHint="Enter welding time in hours, minutes, and seconds format"
									/>
									<View style={styles.timerControlsInline}>
										{hasTimerValue && (
											<GlassView
												glassEffectStyle="clear"
												style={[
													styles.timerIconGlass,
													Platform.OS === 'android' &&
														styles.glassButtonAndroidFallback,
												]}
											>
												<TouchableOpacity
													onPress={handleStopTimer}
													style={styles.stopwatchButtonInline}
												>
													{Platform.OS === 'ios' ? (
														<SymbolView
															name="stop.fill"
															size={16}
															type="monochrome"
															tintColor={colors.text}
														/>
													) : (
														<MaterialCommunityIcons
															name="stop"
															size={16}
															color={colors.text}
														/>
													)}
												</TouchableOpacity>
											</GlassView>
										)}
										<GlassView
											glassEffectStyle="clear"
											style={[
												styles.timerIconGlass,
												Platform.OS === 'android' &&
													styles.glassButtonAndroidFallback,
											]}
										>
											<TouchableOpacity
												onPress={handleStartStop}
												style={styles.stopwatchButtonInline}
											>
												{Platform.OS === 'ios' ? (
													<SymbolView
														name={
															isRunning
																? 'pause.fill'
																: hasTimerValue
																	? 'play.fill'
																	: 'timer'
														}
														size={16}
														type="monochrome"
														tintColor={isRunning ? colors.text : colors.primary}
													/>
												) : (
													<MaterialCommunityIcons
														name={
															isRunning
																? 'pause'
																: hasTimerValue
																	? 'play'
																	: 'timer-outline'
														}
														size={16}
														color={isRunning ? colors.text : colors.primary}
													/>
												)}
											</TouchableOpacity>
										</GlassView>
									</View>
								</View>
							</View>
						</View>

						<View style={styles.section}>
							<View style={styles.inputContainer}>
								<Text style={styles.inputLabel}>Efficiency Factor</Text>
								<TouchableOpacity
									style={styles.selectButton}
									onPress={showEfficiencyPicker}
								>
									<Text
										style={[
											styles.selectButtonText,
											!efficiencyFactor && styles.selectButtonTextPlaceholder,
										]}
									>
										{getEfficiencyLabel()}
									</Text>
									{Platform.OS === 'ios' ? (
										<SymbolView
											name="chevron.down"
											size={20}
											type="hierarchical"
											tintColor={colors.textSecondary}
											style={styles.iconSmall}
										/>
									) : (
										<MaterialCommunityIcons
											name="chevron-down"
											size={20}
											color={colors.textSecondary}
										/>
									)}
								</TouchableOpacity>
							</View>
						</View>
					</>
				)}
			</ScrollView>
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
	headerActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
	},
	liquidGlassButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
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
	liquidGlassButtonSquare: {
		width: 70,
		height: 36,
		borderRadius: borderRadius.xl,
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
	headerIconButton: {
		padding: spacing.xs,
		width: 36,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerTextButton: {
		width: 70,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerButtonText: {
		...typography.body,
		color: colors.primary,
		fontWeight: '600',
	},
	scrollContent: {
		paddingHorizontal: spacing.md,
		paddingTop: 0,
		paddingBottom: spacing.md,
		...Platform.select({
			ios: isIPad()
				? {
						paddingHorizontal: spacing.xxl * 2,
					}
				: {},
		}),
	},
	resultCard: {
		borderRadius: borderRadius.lg,
		marginHorizontal: spacing.md,
		marginTop: spacing.sm,
		marginBottom: spacing.md,
		padding: spacing.md,
		overflow: 'hidden',
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.25,
				shadowRadius: 4,
				...(isIPad()
					? {
							marginHorizontal: spacing.xxl * 2,
							padding: spacing.lg,
						}
					: {}),
			},
			android: {
				elevation: 4,
			},
		}),
	},
	resultRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	resultContent: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'baseline',
		gap: spacing.sm,
	},
	resultValue: {
		fontSize: isIPad() ? 64 : 48,
		fontWeight: '700',
		color: colors.primary,
		letterSpacing: -0.5,
	},
	resultPlaceholder: {
		fontSize: isIPad() ? 64 : 48,
		fontWeight: '700',
		color: colors.textSecondary,
		letterSpacing: -0.5,
	},
	resultUnitLabel: {
		fontSize: isIPad() ? 28 : 20,
		fontWeight: '500',
		color: colors.textSecondary,
	},
	resultActions: {
		flexDirection: 'row',
		gap: spacing.xs,
		alignItems: 'center',
	},
	actionButtonGlass: {
		width: 32,
		height: 32,
		borderRadius: 16,
		overflow: 'hidden',
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.2,
				shadowRadius: 3,
			},
			android: {
				elevation: 3,
			},
		}),
	},
	actionButton: {
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
	},
	icon: {
		width: 24,
		height: 24,
	},
	iconSmall: {
		width: 20,
		height: 20,
	},
	iconTiny: {
		width: 16,
		height: 16,
	},
	iconExtraTiny: {
		width: 12,
		height: 12,
	},
	iconMicro: {
		width: 10,
		height: 10,
	},
	clearButtonText: {
		...typography.body,
		color: colors.text,
		fontSize: 15,
	},
	section: {
		marginBottom: spacing.md,
	},
	inputContainer: {
		marginBottom: spacing.md,
	},
	inputLabel: {
		...commonStyles.inputLabel,
	},
	inputWithButtons: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: colors.surfaceVariant,
		borderRadius: borderRadius.md,
		paddingLeft: spacing.md,
		paddingRight: spacing.sm,
		paddingVertical: spacing.xs,
		minHeight: 44,
		borderWidth: Platform.OS === 'ios' ? 0 : StyleSheet.hairlineWidth,
		borderColor: colors.border,
	},
	inputFlexTime: {
		flex: 1,
		...typography.body,
		color: colors.text,
		paddingVertical: spacing.xs,
		paddingRight: spacing.sm,
	},
	timerControlsInline: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
	},
	timerIconGlass: {
		width: 32,
		height: 32,
		borderRadius: 16,
		overflow: 'hidden',
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 1 },
				shadowOpacity: 0.2,
				shadowRadius: 2,
			},
			android: {
				elevation: 2,
			},
		}),
	},
	stopwatchButtonInline: {
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
	},
	input: {
		...commonStyles.input,
		borderWidth: Platform.OS === 'ios' ? 0 : StyleSheet.hairlineWidth,
		borderColor: colors.border,
	},
	inputWithUnit: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: colors.surfaceVariant,
		borderRadius: borderRadius.md,
		paddingHorizontal: spacing.md,
		minHeight: 44,
		borderWidth: Platform.OS === 'ios' ? 0 : StyleSheet.hairlineWidth,
		borderColor: colors.border,
	},
	inputFlex: {
		flex: 1,
		...typography.body,
		color: colors.text,
		paddingVertical: spacing.sm,
		paddingRight: spacing.sm,
	},
	unitText: {
		...typography.body,
		color: colors.textSecondary,
		fontWeight: '500',
	},
	switchButton: {
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
		borderRadius: borderRadius.sm,
		backgroundColor: colors.surfaceVariant,
	},
	segmentedControl: {
		height: 32,
		marginBottom: spacing.sm,
	},
	selectButton: {
		backgroundColor: colors.surfaceVariant,
		borderRadius: borderRadius.md,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderWidth: Platform.OS === 'ios' ? 0 : StyleSheet.hairlineWidth,
		borderColor: colors.border,
		minHeight: 44,
	},
	selectButtonText: {
		...typography.body,
		color: colors.text,
		flex: 1,
	},
	selectButtonTextPlaceholder: {
		color: colors.textSecondary,
	},
	glassButtonAndroidFallback: {
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: 'rgba(255, 255, 255, 0.15)',
	},
	glassCardAndroidFallback: {
		backgroundColor: colors.surface,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
	},
});

export default HeatInputScreen;
