import { GlassView } from 'expo-glass-effect';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { nanoid } from 'nanoid/non-secure';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
	ActionSheetIOS,
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import sec from 'sec';
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

const HeatInputScreen = () => {
	const router = useRouter();
	const insets = useSafeAreaInsets();

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
				const timeInSeconds = sec(time.toString());
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
		} catch (error) {
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
			stop();
			setAccumulatedTime((prev) => prev + ms);
		} else {
			start();
			setIsStopped(false);
		}
	};

	const handleStopTimer = () => {
		stop();
		resetStopwatch();
		setAccumulatedTime(0);
		setIsStopped(true);
		// Keep the time value in the input, but reset the timer state
	};

	const hasTimerValue = time && time !== '00:00:00' && !isStopped;

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
		const timeInSeconds = time ? sec(time.toString()) : null;
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
								Platform.OS === 'android' && styles.glassButtonAndroidFallback,
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

			{/* Result Card - Always Visible at Top */}
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
									Platform.OS === 'android' && styles.glassButtonAndroidFallback,
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
									Platform.OS === 'android' && styles.glassButtonAndroidFallback,
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

			<KeyboardAvoidingView
				enabled
				style={{ flex: 1 }}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				keyboardVerticalOffset={0}
			>
				<ScrollView
					contentContainerStyle={[
						styles.scrollContent,
						{
							paddingBottom: Platform.OS === 'ios' ? insets.bottom + 20 : 20,
						},
					]}
					keyboardShouldPersistTaps="handled"
				>
					{/* Total Energy Mode Toggle */}
					{!settings?.totalEnergy && (
						<View style={styles.section}>
							<View style={styles.inputContainer}>
								<Text style={styles.inputLabel}>Amperage</Text>
								<View style={styles.inputWithUnit}>
									<TextInput
										style={styles.inputFlex}
										value={amperage}
										onChangeText={setAmperage}
										keyboardType="decimal-pad"
										placeholder="0"
										placeholderTextColor={colors.textSecondary}
									/>
									<Text style={styles.unitText}>A</Text>
								</View>
							</View>

							<View style={styles.inputContainer}>
								<Text style={styles.inputLabel}>Voltage</Text>
								<View style={styles.inputWithUnit}>
									<TextInput
										style={styles.inputFlex}
										value={voltage}
										onChangeText={setVoltage}
										keyboardType="decimal-pad"
										placeholder="0"
										placeholderTextColor={colors.textSecondary}
									/>
									<Text style={styles.unitText}>V</Text>
								</View>
							</View>
						</View>
					)}

					{/* Length Input */}
					<View style={styles.section}>
						<View style={styles.inputContainer}>
							{/* Segmented Control */}
							<View style={styles.segmentedControl}>
								<TouchableOpacity
									style={[styles.segment, !isDiameter && styles.segmentActive]}
									onPress={() => setDiameter(false)}
								>
									{Platform.OS === 'ios' ? (
										<SymbolView
											name="ruler"
											size={16}
											type="hierarchical"
											tintColor={
												!isDiameter ? colors.text : colors.textSecondary
											}
											style={styles.iconTiny}
										/>
									) : (
										<MaterialCommunityIcons
											name="ruler"
											size={16}
											color={!isDiameter ? colors.text : colors.textSecondary}
										/>
									)}
									<Text
										style={[
											styles.segmentText,
											!isDiameter && styles.segmentTextActive,
										]}
									>
										Length
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.segment, isDiameter && styles.segmentActive]}
									onPress={() => setDiameter(true)}
								>
									{Platform.OS === 'ios' ? (
										<SymbolView
											name="circle.slash"
											size={16}
											type="hierarchical"
											tintColor={
												isDiameter ? colors.text : colors.textSecondary
											}
											style={styles.iconTiny}
										/>
									) : (
										<MaterialCommunityIcons
											name="diameter-outline"
											size={16}
											color={isDiameter ? colors.text : colors.textSecondary}
										/>
									)}
									<Text
										style={[
											styles.segmentText,
											isDiameter && styles.segmentTextActive,
										]}
									>
										Diameter
									</Text>
								</TouchableOpacity>
							</View>

							<View style={styles.inputWithUnit}>
								<TextInput
									style={styles.inputFlex}
									value={length}
									onChangeText={setLength}
									keyboardType="decimal-pad"
									placeholder="0"
									placeholderTextColor={colors.textSecondary}
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
										style={styles.inputFlex}
										value={totalEnergy}
										onChangeText={setTotalEnergy}
										keyboardType="decimal-pad"
										placeholder="0"
										placeholderTextColor={colors.textSecondary}
									/>
									<Text style={styles.unitText}>kJ</Text>
								</View>
							</View>
						</View>
					) : (
						<>
							<View style={styles.section}>
								<View style={styles.inputContainer}>
									<View style={styles.labelRow}>
										<Text style={styles.inputLabel}>Time</Text>
										<View style={styles.timerControls}>
											{hasTimerValue && (
												<GlassView
													glassEffectStyle="clear"
													style={[
														styles.timerButtonGlass,
														Platform.OS === 'android' &&
															styles.glassTimerButtonAndroidFallback,
													]}
												>
													<TouchableOpacity
														onPress={handleStopTimer}
														style={styles.stopwatchButton}
													>
														{Platform.OS === 'ios' ? (
															<SymbolView
																name="stop.fill"
																size={10}
																type="monochrome"
																tintColor={colors.text}
															/>
														) : (
															<MaterialCommunityIcons
																name="stop"
																size={10}
																color={colors.text}
															/>
														)}
														<Text style={styles.stopwatchText}>Stop</Text>
													</TouchableOpacity>
												</GlassView>
											)}
											<GlassView
												glassEffectStyle="clear"
												style={[
													styles.timerButtonGlass,
													isRunning && styles.timerButtonActiveGlass,
													Platform.OS === 'android' &&
														styles.glassTimerButtonAndroidFallback,
													Platform.OS === 'android' &&
														isRunning &&
														styles.glassTimerButtonActiveAndroidFallback,
												]}
											>
												<TouchableOpacity
													onPress={handleStartStop}
													style={styles.stopwatchButton}
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
															size={!isRunning && !hasTimerValue ? 12 : 10}
															type="monochrome"
															tintColor={
																isRunning ? colors.text : colors.primary
															}
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
															size={!isRunning && !hasTimerValue ? 16 : 10}
															color={isRunning ? colors.text : colors.primary}
														/>
													)}
													<Text
														style={[
															styles.stopwatchText,
															isRunning && styles.stopwatchTextActive,
														]}
													>
														{isRunning
															? 'Pause'
															: hasTimerValue
																? 'Resume'
																: 'Start timer'}
													</Text>
												</TouchableOpacity>
											</GlassView>
										</View>
									</View>
									<TextInput
										style={styles.input}
										value={time}
										onChangeText={setTime}
										placeholder="HH:MM:SS"
										placeholderTextColor={colors.textSecondary}
										keyboardType="numbers-and-punctuation"
									/>
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
		paddingTop: Platform.OS === 'ios' ? 60 : 32,
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
		fontSize: 48,
		fontWeight: '700',
		color: colors.primary,
		letterSpacing: -0.5,
	},
	resultPlaceholder: {
		fontSize: 48,
		fontWeight: '700',
		color: colors.textSecondary,
		letterSpacing: -0.5,
	},
	resultUnitLabel: {
		fontSize: 20,
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
	labelRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: spacing.xs,
	},
	timerControls: {
		flexDirection: 'row',
		gap: spacing.xs,
	},
	timerButtonGlass: {
		borderRadius: borderRadius.md,
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
	timerButtonActiveGlass: {
		...Platform.select({
			ios: {
				shadowColor: colors.primary,
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.3,
				shadowRadius: 4,
			},
			android: {
				elevation: 4,
			},
		}),
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
		flexDirection: 'row',
		backgroundColor: colors.surfaceVariant,
		borderRadius: borderRadius.md,
		padding: 2,
		marginBottom: spacing.sm,
	},
	segment: {
		flex: 1,
		flexDirection: 'row',
		gap: spacing.xs,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.sm,
		borderRadius: borderRadius.sm,
		alignItems: 'center',
		justifyContent: 'center',
	},
	segmentActive: {
		backgroundColor: colors.surface,
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 1 },
				shadowOpacity: 0.1,
				shadowRadius: 2,
			},
			android: {
				elevation: 2,
			},
		}),
	},
	segmentText: {
		...typography.subheadline,
		color: colors.textSecondary,
		fontWeight: '500',
	},
	segmentTextActive: {
		color: colors.text,
		fontWeight: '600',
	},
	stopwatchButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
	},
	stopwatchText: {
		...typography.caption1,
		color: colors.text,
		fontWeight: '600',
	},
	stopwatchTextActive: {
		color: colors.text,
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
	glassTimerButtonAndroidFallback: {
		backgroundColor: colors.surfaceVariant,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
	},
	glassTimerButtonActiveAndroidFallback: {
		backgroundColor: colors.surface,
		borderColor: colors.primary,
		borderWidth: 1,
	},
});

export default HeatInputScreen;
