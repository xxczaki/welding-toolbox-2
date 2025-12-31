import * as Clipboard from 'expo-clipboard';
import { GlassView } from 'expo-glass-effect';
import React, { useEffect, useRef, useState } from 'react';
import {
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
import { ceAws, ceq, cet, pcm, pren } from 'welding-utils';
import {
	borderRadius,
	colors,
	commonStyles,
	spacing,
	typography,
} from '../theme';
import { isIPad } from '../utils/platform';

const WeldabilityScreen = () => {
	// Refs for keyboard navigation
	const carbonRef = useRef<TextInput>(null);
	const manganeseRef = useRef<TextInput>(null);
	const siliconRef = useRef<TextInput>(null);
	const chromiumRef = useRef<TextInput>(null);
	const nickelRef = useRef<TextInput>(null);
	const molybdenumRef = useRef<TextInput>(null);
	const copperRef = useRef<TextInput>(null);
	const vanadiumRef = useRef<TextInput>(null);
	const nitrogenRef = useRef<TextInput>(null);
	const boronRef = useRef<TextInput>(null);

	// Form state
	const [carbon, setCarbon] = useState('');
	const [manganese, setManganese] = useState('');
	const [chromium, setChromium] = useState('');
	const [molybdenum, setMolybdenum] = useState('');
	const [vanadium, setVanadium] = useState('');
	const [nickel, setNickel] = useState('');
	const [copper, setCopper] = useState('');
	const [silicon, setSilicon] = useState('');
	const [boron, setBoron] = useState('');
	const [nitrogen, setNitrogen] = useState('');

	// Results state
	const [results, setResults] = useState({
		ceq: '0',
		cet: '0',
		ceAws: '0',
		pcm: '0',
		pren: '0',
	});

	// Auto-calculate whenever inputs change
	useEffect(() => {
		// Check if we have at least some inputs
		const hasInputs =
			carbon ||
			manganese ||
			chromium ||
			molybdenum ||
			vanadium ||
			nickel ||
			copper ||
			silicon ||
			boron ||
			nitrogen;

		if (!hasInputs) {
			setResults({
				ceq: '0',
				cet: '0',
				ceAws: '0',
				pcm: '0',
				pren: '0',
			});
			return;
		}

		// Parse inputs (replace comma with dot for decimal)
		const c = Number((carbon || '0').replace(/,/g, '.'));
		const mn = Number((manganese || '0').replace(/,/g, '.'));
		const cr = Number((chromium || '0').replace(/,/g, '.'));
		const mo = Number((molybdenum || '0').replace(/,/g, '.'));
		const v = Number((vanadium || '0').replace(/,/g, '.'));
		const ni = Number((nickel || '0').replace(/,/g, '.'));
		const cu = Number((copper || '0').replace(/,/g, '.'));
		const si = Number((silicon || '0').replace(/,/g, '.'));
		const b = Number((boron || '0').replace(/,/g, '.'));
		const n = Number((nitrogen || '0').replace(/,/g, '.'));

		// Calculate results
		// CEQ/CET: Require at least carbon to calculate
		const hasCeqCetData = carbon;
		let ceqResult = '0';
		let cetResult = '0';

		if (hasCeqCetData) {
			const ceqCetData = {
				carbon: c,
				manganese: mn,
				chromium: cr,
				molybdenum: mo,
				vanadium: v,
				nickel: ni,
				copper: cu,
			};
			const ceqValue = Math.round(ceq(ceqCetData) * 100) / 100;
			const cetValue = Math.round(cet(ceqCetData) * 100) / 100;
			ceqResult = Number.isNaN(ceqValue) ? '0' : ceqValue.toString();
			cetResult = Number.isNaN(cetValue) ? '0' : cetValue.toString();
		}

		// CE AWS: Require at least carbon to calculate
		const hasCeAwsData = carbon;
		let ceAwsResult = '0';

		if (hasCeAwsData) {
			const ceAwsData = {
				silicon: si,
				carbon: c,
				manganese: mn,
				chromium: cr,
				molybdenum: mo,
				vanadium: v,
				nickel: ni,
				copper: cu,
			};
			const ceAwsValue = Math.round(ceAws(ceAwsData) * 100) / 100;
			ceAwsResult = Number.isNaN(ceAwsValue) ? '0' : ceAwsValue.toString();
		}

		// PCM: Require at least carbon to calculate
		const hasPcmData = carbon;
		let pcmResult = '0';

		if (hasPcmData) {
			const pcmData = {
				silicon: si,
				boron: b,
				carbon: c,
				manganese: mn,
				chromium: cr,
				molybdenum: mo,
				vanadium: v,
				nickel: ni,
				copper: cu,
			};
			const pcmValue = Math.round(pcm(pcmData) * 100) / 100;
			pcmResult = Number.isNaN(pcmValue) ? '0' : pcmValue.toString();
		}

		// PREN: Require at least one of chromium, molybdenum, or nitrogen
		const hasPrenData = chromium || molybdenum || nitrogen;
		let prenResult = '0';

		if (hasPrenData) {
			const prenData = { nitrogen: n, chromium: cr, molybdenum: mo };
			const prenValue = Math.round(pren(prenData) * 100) / 100;
			prenResult = Number.isNaN(prenValue) ? '0' : prenValue.toString();
		}

		setResults({
			ceq: ceqResult,
			cet: cetResult,
			ceAws: ceAwsResult,
			pcm: pcmResult,
			pren: prenResult,
		});
	}, [
		carbon,
		manganese,
		chromium,
		molybdenum,
		vanadium,
		nickel,
		copper,
		silicon,
		boron,
		nitrogen,
	]);

	const resetForm = () => {
		setCarbon('');
		setManganese('');
		setChromium('');
		setMolybdenum('');
		setVanadium('');
		setNickel('');
		setCopper('');
		setSilicon('');
		setBoron('');
		setNitrogen('');
	};

	const hasInputs =
		carbon ||
		manganese ||
		chromium ||
		molybdenum ||
		vanadium ||
		nickel ||
		copper ||
		silicon ||
		boron ||
		nitrogen;

	return (
		<View style={styles.container}>
			{/* Header */}
			<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
				<View style={styles.header}>
					<Text style={styles.headerTitle}>Weldability</Text>
					{hasInputs && (
						<GlassView
							glassEffectStyle="clear"
							style={[
								styles.liquidGlassButtonSquare,
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
			</TouchableWithoutFeedback>

			{/* Results Card - Fixed at top */}
			<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
				<GlassView
					glassEffectStyle="clear"
					style={[
						styles.resultsCard,
						Platform.OS === 'android' && styles.glassAndroidFallback,
					]}
				>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.resultsScrollContent}
					>
						<View style={styles.resultsGrid}>
							<TouchableOpacity
								onPress={async () => {
									if (results.ceq !== '0') {
										await Clipboard.setStringAsync(results.ceq);
									}
								}}
								disabled={results.ceq === '0'}
								style={styles.resultItem}
							>
								<Text style={styles.resultLabel}>CEQ</Text>
								<Text
									style={
										results.ceq === '0'
											? styles.resultValueEmpty
											: styles.resultValue
									}
								>
									{results.ceq === '0' ? '—' : results.ceq}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={async () => {
									if (results.cet !== '0') {
										await Clipboard.setStringAsync(results.cet);
									}
								}}
								disabled={results.cet === '0'}
								style={styles.resultItem}
							>
								<Text style={styles.resultLabel}>CET</Text>
								<Text
									style={
										results.cet === '0'
											? styles.resultValueEmpty
											: styles.resultValue
									}
								>
									{results.cet === '0' ? '—' : results.cet}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={async () => {
									if (results.ceAws !== '0') {
										await Clipboard.setStringAsync(results.ceAws);
									}
								}}
								disabled={results.ceAws === '0'}
								style={styles.resultItem}
							>
								<Text style={styles.resultLabel}>CE (AWS)</Text>
								<Text
									style={
										results.ceAws === '0'
											? styles.resultValueEmpty
											: styles.resultValue
									}
								>
									{results.ceAws === '0' ? '—' : results.ceAws}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={async () => {
									if (results.pcm !== '0') {
										await Clipboard.setStringAsync(results.pcm);
									}
								}}
								disabled={results.pcm === '0'}
								style={styles.resultItem}
							>
								<Text style={styles.resultLabel}>PCM</Text>
								<Text
									style={
										results.pcm === '0'
											? styles.resultValueEmpty
											: styles.resultValue
									}
								>
									{results.pcm === '0' ? '—' : results.pcm}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={async () => {
									if (results.pren !== '0') {
										await Clipboard.setStringAsync(results.pren);
									}
								}}
								disabled={results.pren === '0'}
								style={styles.resultItem}
							>
								<Text style={styles.resultLabel}>PREN</Text>
								<Text
									style={
										results.pren === '0'
											? styles.resultValueEmpty
											: styles.resultValue
									}
								>
									{results.pren === '0' ? '—' : results.pren}
								</Text>
							</TouchableOpacity>
						</View>
					</ScrollView>
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
				automaticallyAdjustKeyboardInsets={true}
			>
				{/* Input Fields */}
				<View style={styles.inputsContainer}>
					<View style={styles.column}>
						<InputField
							ref={carbonRef}
							label="Carbon (C)"
							value={carbon}
							onChangeText={setCarbon}
							returnKeyType="next"
							onSubmitEditing={() => molybdenumRef.current?.focus()}
							accessibilityLabel="Carbon input field"
							accessibilityHint="Enter carbon percentage"
						/>
						<InputField
							ref={manganeseRef}
							label="Manganese (Mn)"
							value={manganese}
							onChangeText={setManganese}
							returnKeyType="next"
							onSubmitEditing={() => copperRef.current?.focus()}
							accessibilityLabel="Manganese input field"
							accessibilityHint="Enter manganese percentage"
						/>
						<InputField
							ref={siliconRef}
							label="Silicon (Si)"
							value={silicon}
							onChangeText={setSilicon}
							returnKeyType="next"
							onSubmitEditing={() => vanadiumRef.current?.focus()}
							accessibilityLabel="Silicon input field"
							accessibilityHint="Enter silicon percentage"
						/>
						<InputField
							ref={chromiumRef}
							label="Chromium (Cr)"
							value={chromium}
							onChangeText={setChromium}
							returnKeyType="next"
							onSubmitEditing={() => nitrogenRef.current?.focus()}
							accessibilityLabel="Chromium input field"
							accessibilityHint="Enter chromium percentage"
						/>
						<InputField
							ref={nickelRef}
							label="Nickel (Ni)"
							value={nickel}
							onChangeText={setNickel}
							returnKeyType="next"
							onSubmitEditing={() => boronRef.current?.focus()}
							accessibilityLabel="Nickel input field"
							accessibilityHint="Enter nickel percentage"
						/>
					</View>
					<View style={styles.column}>
						<InputField
							ref={molybdenumRef}
							label="Molybdenum (Mo)"
							value={molybdenum}
							onChangeText={setMolybdenum}
							returnKeyType="next"
							onSubmitEditing={() => manganeseRef.current?.focus()}
							accessibilityLabel="Molybdenum input field"
							accessibilityHint="Enter molybdenum percentage"
						/>
						<InputField
							ref={copperRef}
							label="Copper (Cu)"
							value={copper}
							onChangeText={setCopper}
							returnKeyType="next"
							onSubmitEditing={() => siliconRef.current?.focus()}
							accessibilityLabel="Copper input field"
							accessibilityHint="Enter copper percentage"
						/>
						<InputField
							ref={vanadiumRef}
							label="Vanadium (V)"
							value={vanadium}
							onChangeText={setVanadium}
							returnKeyType="next"
							onSubmitEditing={() => chromiumRef.current?.focus()}
							accessibilityLabel="Vanadium input field"
							accessibilityHint="Enter vanadium percentage"
						/>
						<InputField
							ref={nitrogenRef}
							label="Nitrogen (N)"
							value={nitrogen}
							onChangeText={setNitrogen}
							returnKeyType="next"
							onSubmitEditing={() => nickelRef.current?.focus()}
							accessibilityLabel="Nitrogen input field"
							accessibilityHint="Enter nitrogen percentage"
						/>
						<InputField
							ref={boronRef}
							label="Boron (B)"
							value={boron}
							onChangeText={setBoron}
							returnKeyType="done"
							accessibilityLabel="Boron input field"
							accessibilityHint="Enter boron percentage"
						/>
					</View>
				</View>
			</ScrollView>
		</View>
	);
};

// Reusable Input Field Component
const InputField = React.forwardRef<
	TextInput,
	{
		label: string;
		value: string;
		onChangeText: (text: string) => void;
		returnKeyType?: 'next' | 'done';
		onSubmitEditing?: () => void;
		accessibilityLabel?: string;
		accessibilityHint?: string;
	}
>(
	(
		{
			label,
			value,
			onChangeText,
			returnKeyType = 'done',
			onSubmitEditing,
			accessibilityLabel,
			accessibilityHint,
		},
		ref,
	) => (
		<View style={styles.inputContainer}>
			<Text style={styles.inputLabel}>{label}</Text>
			<TextInput
				ref={ref}
				style={styles.input}
				value={value}
				onChangeText={onChangeText}
				keyboardType="decimal-pad"
				maxLength={10}
				placeholder="0"
				placeholderTextColor={colors.textSecondary}
				returnKeyType={returnKeyType}
				onSubmitEditing={onSubmitEditing}
				blurOnSubmit={returnKeyType === 'done'}
				accessibilityLabel={accessibilityLabel}
				accessibilityHint={accessibilityHint}
			/>
		</View>
	),
);

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
	headerButton: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	headerButtonText: {
		...typography.body,
		color: colors.primary,
		fontWeight: '600',
	},
	liquidGlassButtonSquare: {
		width: 70,
		height: 36,
		borderRadius: borderRadius.xl,
		overflow: 'hidden',
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 4 },
				shadowOpacity: 0.15,
				shadowRadius: 8,
			},
			android: {
				elevation: 3,
			},
		}),
	},
	headerTextButton: {
		width: 70,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
	},
	clearButtonText: {
		...typography.body,
		color: colors.text,
		fontSize: 15,
	},
	glassButtonAndroidFallback: {
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: 'rgba(255, 255, 255, 0.15)',
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
	resultsCard: {
		borderRadius: borderRadius.lg,
		marginHorizontal: spacing.md,
		marginTop: spacing.sm,
		marginBottom: spacing.md,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
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
	glassAndroidFallback: {
		backgroundColor: colors.surface,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
	},
	resultsScrollContent: {
		flexGrow: 1,
	},
	resultsGrid: {
		flexDirection: 'row',
		flexWrap: 'nowrap',
		justifyContent: 'space-between',
		width: '100%',
		gap: spacing.sm,
	},
	resultItem: {
		alignItems: 'center',
		paddingVertical: spacing.xs,
		flexShrink: 0,
		minWidth: 50,
	},
	resultLabel: {
		...typography.caption1,
		color: colors.textSecondary,
		marginBottom: 2,
		fontSize: 10,
		textAlign: 'center',
		...Platform.select({
			ios: {
				textTransform: 'uppercase',
				fontWeight: '600',
				letterSpacing: 0.3,
			},
		}),
	},
	resultValue: {
		...typography.title3,
		color: colors.primary,
		fontWeight: '700',
		fontSize: 17,
		letterSpacing: -0.2,
		textAlign: 'center',
		flexShrink: 0,
	},
	resultValueEmpty: {
		...typography.title3,
		color: 'rgba(255, 255, 255, 0.2)',
		fontWeight: '400',
		fontSize: 17,
		textAlign: 'center',
		flexShrink: 0,
	},
	inputsContainer: {
		flexDirection: 'row',
		marginHorizontal: -spacing.sm,
	},
	column: {
		flex: 1,
		paddingHorizontal: spacing.sm,
	},
	inputContainer: {
		marginBottom: spacing.md,
	},
	inputLabel: {
		...commonStyles.inputLabel,
	},
	input: {
		...commonStyles.input,
		borderWidth: Platform.OS === 'ios' ? 0 : StyleSheet.hairlineWidth,
		borderColor: colors.border,
	},
});

export default WeldabilityScreen;
