import { MaterialCommunityIcons } from '@expo/vector-icons';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { GlassView } from 'expo-glass-effect';
import * as LiveActivity from 'expo-live-activity';
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
	const scrollViewRef = useRef<ScrollView>(null);

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
	const [customFieldValues, setCustomFieldValues] = useState<
		Record<string, string>
	>({});

	// Stopwatch
	const { ms, start, stop, resetStopwatch, isRunning } = useStopwatch();
	const [accumulatedTime, setAccumulatedTime] = useState<number>(0);
	const [isStopped, setIsStopped] = useState<boolean>(false);
	const [timerUsed, setTimerUsed] = useState<boolean>(false);
	const [activityId, setActivityId] = useState<string | null>(null);
	const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const startTimeRef = useRef<number | null>(null);

	// Result
	const [result, setResult] = useState<number>(0);
	const [travelSpeed, setTravelSpeed] = useState<number>(0);

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

	// Format time for display
	const formatTime = useCallback((totalMs: number): string => {
		return new Date(totalMs).toISOString().slice(11, -5);
	}, []);

	// Update time field when stopwatch is running
	useEffect(() => {
		if (isRunning) {
			const totalMs = ms + accumulatedTime;
			setTime(formatTime(totalMs));
		}
	}, [isRunning, ms, accumulatedTime, formatTime]);

	// Update Live Activity when timer value changes
	useEffect(() => {
		if (Platform.OS === 'ios' && activityId && timerUsed) {
			if (updateIntervalRef.current) {
				clearInterval(updateIntervalRef.current);
			}

			if (isRunning && startTimeRef.current === null) {
				startTimeRef.current = Date.now() - accumulatedTime;
			} else if (!isRunning) {
				startTimeRef.current = null;
			}

			const updateLiveActivity = () => {
				let totalMs = accumulatedTime;
				if (isRunning && startTimeRef.current !== null) {
					totalMs = Date.now() - startTimeRef.current;
				}

				const formattedTime = formatTime(totalMs);
				const isPaused = !isRunning && accumulatedTime > 0;

				try {
					LiveActivity.updateActivity(activityId, {
						title: isPaused ? 'Heat Input (Paused)' : 'Heat Input',
						subtitle: formattedTime,
					});
				} catch {
					// Activity dismissed - will be cleaned up by listener
				}
			};

			updateLiveActivity();

			if (isRunning) {
				updateIntervalRef.current = setInterval(updateLiveActivity, 1000);
			}

			return () => {
				if (updateIntervalRef.current) {
					clearInterval(updateIntervalRef.current);
				}
			};
		}
		return undefined;
	}, [accumulatedTime, isRunning, timerUsed, activityId, formatTime]);

	// Listen for Live Activity dismissal
	useEffect(() => {
		if (Platform.OS !== 'ios') return;

		const subscription = LiveActivity.addActivityUpdatesListener((event) => {
			if (
				event.activityID === activityId &&
				(event.activityState === 'dismissed' || event.activityState === 'ended')
			) {
				setActivityId(null);
			}
		});

		return () => subscription?.remove();
	}, [activityId]);

	// Cleanup Live Activity on unmount
	useEffect(() => {
		return () => {
			if (Platform.OS === 'ios' && activityId) {
				try {
					LiveActivity.stopActivity(activityId, {
						title: 'Heat Input (Stopped)',
						subtitle: '00:00:00',
					});
				} catch {
					// Activity already dismissed - ignore
				}
			}
		};
	}, [activityId]);

	// Calculate travel speed
	const calculatedTravelSpeed = useMemo(() => {
		// Travel speed can't be calculated in total energy mode (no time input)
		if (!length || !time || settings?.totalEnergy) {
			return 0;
		}

		try {
			let calculatedLength = Number((length || '0').replace(/,/g, '.'));
			const timeInSeconds = toSeconds(time.toString());

			if (timeInSeconds === 0) {
				return 0;
			}

			// Apply diameter conversion if needed
			if (isDiameter) {
				calculatedLength = Number((calculatedLength * Math.PI).toFixed(2));
			}

			// Calculate base speed (unit per second)
			let speed = calculatedLength / timeInSeconds;

			// Convert based on selected unit
			const unit = settings?.travelSpeedUnit || 'mm/min';
			if (unit.endsWith('/min')) {
				speed *= 60; // Convert to per minute
			}

			if (Number.isNaN(speed)) {
				return 0;
			}

			return Math.round((speed + Number.EPSILON) * 100) / 100;
		} catch {
			return 0;
		}
	}, [
		length,
		time,
		isDiameter,
		settings?.travelSpeedUnit,
		settings?.totalEnergy,
	]);

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

	// Update travel speed state when calculation changes
	useEffect(() => {
		setTravelSpeed(calculatedTravelSpeed);
	}, [calculatedTravelSpeed]);

	const handleStartStop = async () => {
		if (isRunning) {
			// Pause: accumulate the time and reset the stopwatch
			// Calculate current elapsed time from startTimeRef if available
			if (startTimeRef.current !== null) {
				const currentElapsed = Date.now() - startTimeRef.current;
				setAccumulatedTime(currentElapsed);
			} else {
				setAccumulatedTime((prev) => prev + ms);
			}
			stop();
			resetStopwatch();
			startTimeRef.current = null;
		} else {
			start();
			setIsStopped(false);
			setTimerUsed(true);

			// Start Live Activity if not already started
			if (Platform.OS === 'ios' && !activityId) {
				const id = LiveActivity.startActivity(
					{
						title: 'Heat Input',
						subtitle: formatTime(accumulatedTime),
					},
					{
						backgroundColor: '#1c1c1e',
						titleColor: '#ffffff',
						subtitleColor: '#98989d',
						deepLinkUrl: '/(heat-input)',
					},
				);
				if (id) {
					setActivityId(id);
					startTimeRef.current = Date.now() - accumulatedTime;
				}
			} else {
				startTimeRef.current = Date.now() - accumulatedTime;
			}
		}
	};

	const handleStopTimer = () => {
		const finalTime = formatTime(accumulatedTime);
		stop();
		resetStopwatch();
		setAccumulatedTime(0);
		setIsStopped(true);
		setTimerUsed(false);

		if (Platform.OS === 'ios' && activityId) {
			try {
				LiveActivity.stopActivity(activityId, {
					title: 'Heat Input (Stopped)',
					subtitle: finalTime,
				});
			} catch {
				// Activity already dismissed - ignore
			}
			setActivityId(null);
		}
	};

	const handleTimeChange = (value: string) => {
		setTime(value);
		if (timerUsed || isRunning) {
			const finalTime = formatTime(accumulatedTime);
			stop();
			resetStopwatch();
			setAccumulatedTime(0);
			setIsStopped(true);
			setTimerUsed(false);

			if (Platform.OS === 'ios' && activityId) {
				try {
					LiveActivity.stopActivity(activityId, {
						title: 'Heat Input (Stopped)',
						subtitle: finalTime,
					});
				} catch {
					// Activity already dismissed - ignore
				}
				setActivityId(null);
			}
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
				[element.name]: customFieldValues[element.name] || 'N/A',
			})) || [];

		// Format travel speed for history
		const travelSpeedFormatted =
			travelSpeed > 0
				? `${travelSpeed} ${settings?.travelSpeedUnit || 'mm/min'}`
				: 'N/A';

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
				'Travel Speed': travelSpeedFormatted,
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
		setCustomFieldValues({});
		const finalTime = formatTime(accumulatedTime);
		resetStopwatch();
		setAccumulatedTime(0);
		setIsStopped(false);
		setTimerUsed(false);
		setResult(0);

		if (Platform.OS === 'ios' && activityId) {
			try {
				LiveActivity.stopActivity(activityId, {
					title: 'Heat Input (Stopped)',
					subtitle: finalTime,
				});
			} catch {
				// Activity already dismissed - ignore
			}
			setActivityId(null);
		}
	};

	const hasInputs =
		amperage ||
		voltage ||
		length ||
		time ||
		efficiencyFactor ||
		totalEnergy ||
		Object.keys(customFieldValues).length > 0;

	const efficiencyOptions = [
		{ label: '0.6 – 141, 15', value: '0.6' },
		{ label: '0.8 – 111, 114, 131, 135, 136, 138', value: '0.8' },
		{ label: '1.0 – 121, 122, 125', value: '1.0' },
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
					<View style={styles.resultContainer}>
						<View style={styles.resultRow}>
							<View style={styles.resultContent}>
								{result === 0 ? (
									<View style={styles.resultValueRow}>
										<Text style={styles.resultPlaceholder}>—</Text>
										<Text style={styles.resultUnitLabel}>
											kJ/{settings?.resultUnit || 'mm'}
										</Text>
									</View>
								) : (
									<View style={styles.resultValueRow}>
										<Text style={styles.resultValue}>{result}</Text>
										<Text style={styles.resultUnitLabel}>
											kJ/{settings?.resultUnit || 'mm'}
										</Text>
									</View>
								)}
							</View>
							<View style={styles.resultActions}>
								<GlassView
									glassEffectStyle="clear"
									style={[
										styles.actionButtonGlass,
										Platform.OS === 'android' &&
											styles.glassButtonAndroidFallback,
										result === 0 && styles.actionButtonDisabled,
									]}
								>
									<TouchableOpacity
										onPress={async () => {
											await Clipboard.setStringAsync(`${result}`);
										}}
										style={styles.actionButton}
										disabled={result === 0}
									>
										{Platform.OS === 'ios' ? (
											<SymbolView
												name="doc.on.doc"
												size={20}
												type="hierarchical"
												tintColor={
													result === 0 ? colors.textSecondary : colors.text
												}
												style={styles.iconSmall}
											/>
										) : (
											<MaterialCommunityIcons
												name="content-copy"
												size={18}
												color={
													result === 0 ? colors.textSecondary : colors.text
												}
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
										result === 0 && styles.actionButtonDisabled,
									]}
								>
									<TouchableOpacity
										onPress={saveToHistory}
										style={styles.actionButton}
										disabled={result === 0}
									>
										{Platform.OS === 'ios' ? (
											<SymbolView
												name="arrow.down.doc"
												size={20}
												type="hierarchical"
												tintColor={
													result === 0 ? colors.textSecondary : colors.primary
												}
												style={styles.iconSmall}
											/>
										) : (
											<MaterialCommunityIcons
												name="content-save"
												size={18}
												color={
													result === 0 ? colors.textSecondary : colors.primary
												}
											/>
										)}
									</TouchableOpacity>
								</GlassView>
							</View>
						</View>
						{!settings?.totalEnergy && (
							<View style={styles.travelSpeedRow}>
								<Text style={styles.travelSpeedLabel}>Travel Speed:</Text>
								<Text
									style={[
										styles.travelSpeedValue,
										travelSpeed === 0 && styles.travelSpeedPlaceholder,
									]}
								>
									{travelSpeed === 0 ? '—' : travelSpeed}
								</Text>
								<Text style={styles.travelSpeedUnit}>
									{settings?.travelSpeedUnit || 'mm/min'}
								</Text>
							</View>
						)}
					</View>
				</GlassView>
			</TouchableWithoutFeedback>

			<ScrollView
				ref={scrollViewRef}
				contentContainerStyle={[
					styles.scrollContent,
					{
						paddingBottom: Platform.OS === 'ios' ? 300 : 150,
					},
				]}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="interactive"
				automaticallyAdjustKeyboardInsets={true}
			>
				{/* Amperage and Voltage inputs */}
				{!settings?.totalEnergy && (
					<View style={styles.section}>
						<View style={styles.twoColumnRow}>
							<View style={styles.columnHalf}>
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
							</View>
							<View style={styles.columnHalf}>
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
						</View>
					</View>
				)}

				{/* Length and Time Row */}
				{settings?.totalEnergy ? (
					<>
						<View style={styles.section}>
							<View style={styles.twoColumnRow}>
								<View style={styles.columnHalf}>
									<View style={styles.inputContainer}>
										<Text style={styles.inputLabel}>
											{isDiameter ? 'Diameter' : 'Length'}
										</Text>
										<View style={styles.inputWithUnit}>
											<TextInput
												ref={lengthRef}
												style={styles.inputFlex}
												value={length}
												onChangeText={setLength}
												keyboardType="decimal-pad"
												placeholder="0"
												placeholderTextColor={colors.textSecondary}
												returnKeyType="next"
												onSubmitEditing={() => totalEnergyRef.current?.focus()}
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
								<View style={styles.columnHalf}>
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
							</View>
						</View>

						{/* Controls Row */}
						<View style={[styles.section, { marginTop: -spacing.xs }]}>
							<View style={styles.twoColumnRow}>
								<View style={styles.columnHalf}>
									<View style={styles.controlWrapper}>
										<SegmentedControl
											values={['Length', 'Diameter']}
											selectedIndex={isDiameter ? 1 : 0}
											onChange={(event) => {
												setDiameter(
													event.nativeEvent.selectedSegmentIndex === 1,
												);
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
									</View>
								</View>
								<View style={styles.columnHalf} />
							</View>
						</View>
					</>
				) : (
					<>
						<View style={styles.section}>
							<View style={styles.twoColumnRow}>
								<View style={styles.columnHalf}>
									<View style={styles.inputContainer}>
										<Text style={styles.inputLabel}>
											{isDiameter ? 'Diameter' : 'Length'}
										</Text>
										<View style={styles.inputWithUnit}>
											<TextInput
												ref={lengthRef}
												style={styles.inputFlex}
												value={length}
												onChangeText={setLength}
												keyboardType="decimal-pad"
												placeholder="0"
												placeholderTextColor={colors.textSecondary}
												returnKeyType="next"
												onSubmitEditing={() => timeRef.current?.focus()}
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
								<View style={styles.columnHalf}>
									<View style={styles.inputContainer}>
										<Text style={styles.inputLabel}>Time</Text>
										<View style={styles.inputWithUnit}>
											<TextInput
												ref={timeRef}
												style={styles.inputFlex}
												value={time}
												onChangeText={handleTimeChange}
												placeholder="HH:MM:SS"
												placeholderTextColor={colors.textSecondary}
												keyboardType="numbers-and-punctuation"
												returnKeyType="next"
												onSubmitEditing={showEfficiencyPicker}
												accessibilityLabel="Time input field"
												accessibilityHint="Enter welding time in hours, minutes, and seconds format"
											/>
										</View>
									</View>
								</View>
							</View>
						</View>

						{/* Controls Row */}
						<View style={[styles.section, { marginTop: -spacing.xs }]}>
							<View style={styles.twoColumnRow}>
								<View style={styles.columnHalf}>
									<View style={styles.controlWrapper}>
										<SegmentedControl
											values={['Length', 'Diameter']}
											selectedIndex={isDiameter ? 1 : 0}
											onChange={(event) => {
												setDiameter(
													event.nativeEvent.selectedSegmentIndex === 1,
												);
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
									</View>
								</View>
								<View style={styles.columnHalf}>
									<View style={styles.timerControlsRow}>
										<GlassView
											glassEffectStyle="clear"
											style={[
												styles.timerButtonGlassFlex,
												Platform.OS === 'android' &&
													styles.glassButtonAndroidFallback,
											]}
										>
											<TouchableOpacity
												onPress={handleStartStop}
												style={styles.timerButtonWithText}
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
														size={14}
														type="monochrome"
														tintColor={isRunning ? colors.text : colors.primary}
														style={styles.iconExtraTiny}
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
														size={14}
														color={isRunning ? colors.text : colors.primary}
													/>
												)}
												<Text
													style={[
														styles.timerButtonText,
														!isRunning &&
															!hasTimerValue &&
															styles.timerButtonTextPrimary,
													]}
												>
													{isRunning
														? 'Pause'
														: hasTimerValue
															? 'Resume'
															: 'Start Timer'}
												</Text>
											</TouchableOpacity>
										</GlassView>
										{(isRunning || hasTimerValue) && (
											<GlassView
												glassEffectStyle="clear"
												style={[
													styles.timerButtonGlass,
													Platform.OS === 'android' &&
														styles.glassButtonAndroidFallback,
												]}
											>
												<TouchableOpacity
													onPress={handleStopTimer}
													style={styles.timerButtonWithText}
												>
													{Platform.OS === 'ios' ? (
														<SymbolView
															name="stop.fill"
															size={14}
															type="monochrome"
															tintColor={colors.text}
															style={styles.iconExtraTiny}
														/>
													) : (
														<MaterialCommunityIcons
															name="stop"
															size={14}
															color={colors.text}
														/>
													)}
													<Text style={styles.timerButtonText}>Stop</Text>
												</TouchableOpacity>
											</GlassView>
										)}
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

				{/* Custom Fields */}
				{settings?.customFields && settings.customFields.length > 0 && (
					<>
						<View style={[styles.separator, { marginBottom: spacing.md }]} />
						{settings.customFields.map((field, index) => (
							<View key={field.timestamp} style={styles.section}>
								<View style={styles.inputContainer}>
									<Text style={styles.inputLabel}>
										{field.name}
										{field.unit && ` (${field.unit})`}
									</Text>
									<TextInput
										style={styles.input}
										value={customFieldValues[field.name] || ''}
										onChangeText={(value) =>
											setCustomFieldValues({
												...customFieldValues,
												[field.name]: value,
											})
										}
										placeholder="Enter value"
										placeholderTextColor={colors.textSecondary}
										returnKeyType={
											index === (settings.customFields?.length ?? 0) - 1
												? 'done'
												: 'next'
										}
										accessibilityLabel={`${field.name} input field`}
										accessibilityHint={`Enter value for ${field.name}`}
									/>
								</View>
							</View>
						))}
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
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
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
							paddingHorizontal: spacing.lg,
							paddingVertical: spacing.md,
						}
					: {}),
			},
			android: {
				elevation: 4,
			},
		}),
	},
	resultContainer: {
		gap: 4,
	},
	resultRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	resultContent: {
		flex: 1,
	},
	resultValueRow: {
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
	travelSpeedRow: {
		flexDirection: 'row',
		alignItems: 'baseline',
		gap: 4,
	},
	travelSpeedLabel: {
		fontSize: isIPad() ? 16 : 14,
		fontWeight: '500',
		color: colors.textSecondary,
	},
	travelSpeedValue: {
		fontSize: isIPad() ? 18 : 16,
		fontWeight: '600',
		color: colors.text,
	},
	travelSpeedPlaceholder: {
		color: colors.textSecondary,
	},
	travelSpeedUnit: {
		fontSize: isIPad() ? 16 : 14,
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
	actionButtonDisabled: {
		opacity: 0.3,
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
	twoColumnRow: {
		flexDirection: 'row',
		gap: spacing.sm,
	},
	columnHalf: {
		flex: 1,
	},
	inputContainer: {
		gap: spacing.xs,
	},
	inputLabel: {
		...commonStyles.inputLabel,
		marginBottom: 0,
	},
	inputWithButtons: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: colors.surfaceVariant,
		borderRadius: borderRadius.lg,
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
	sectionTitle: {
		...typography.title3,
		color: colors.textSecondary,
		marginBottom: spacing.sm,
		...Platform.select({
			ios: {
				textTransform: 'uppercase',
				fontSize: 13,
				fontWeight: '600',
				letterSpacing: -0.08,
			},
		}),
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: colors.border,
	},
	inputWithUnit: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: colors.surfaceVariant,
		borderRadius: borderRadius.lg,
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
		width: '100%',
	},
	controlWrapper: {
		flex: 1,
	},
	timerControlsRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
		flex: 1,
	},
	timerButtonGlass: {
		height: 32,
		borderRadius: borderRadius.lg,
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
	timerButtonGlassFlex: {
		height: 32,
		borderRadius: borderRadius.lg,
		overflow: 'hidden',
		flex: 1,
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
	timerButtonWithText: {
		height: 32,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 4,
		flex: 1,
	},
	timerButtonText: {
		...typography.body,
		color: colors.text,
		fontSize: 13,
		fontWeight: '500',
	},
	timerButtonTextPrimary: {
		color: colors.primary,
	},
	selectButton: {
		backgroundColor: colors.surfaceVariant,
		borderRadius: borderRadius.lg,
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
