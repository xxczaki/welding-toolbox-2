import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { GlassView } from 'expo-glass-effect';
import { SymbolView } from 'expo-symbols';
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
		const ceqCetData = {
			carbon: c,
			manganese: mn,
			chromium: cr,
			molybdenum: mo,
			vanadium: v,
			nickel: ni,
			copper: cu,
		};
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
		const prenData = { nitrogen: n, chromium: cr, molybdenum: mo };

		const ceqResult = Math.round(ceq(ceqCetData) * 100) / 100;
		const cetResult = Math.round(cet(ceqCetData) * 100) / 100;
		const ceAwsResult = Math.round(ceAws(ceAwsData) * 100) / 100;
		const pcmResult = Math.round(pcm(pcmData) * 100) / 100;
		const prenResult = Math.round(pren(prenData) * 100) / 100;

		setResults({
			ceq: Number.isNaN(ceqResult) ? '0' : ceqResult.toString(),
			cet: Number.isNaN(cetResult) ? '0' : cetResult.toString(),
			ceAws: Number.isNaN(ceAwsResult) ? '0' : ceAwsResult.toString(),
			pcm: Number.isNaN(pcmResult) ? '0' : pcmResult.toString(),
			pren: Number.isNaN(prenResult) ? '0' : prenResult.toString(),
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
						<TouchableOpacity onPress={resetForm} style={styles.headerButton}>
							<Text style={styles.headerButtonText}>Clear</Text>
						</TouchableOpacity>
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
				<View style={styles.resultsHeader}>
					<Text style={styles.resultsTitle}>Results</Text>
					{(results.ceq !== '0' || results.cet !== '0') && (
						<TouchableOpacity
							onPress={async () => {
								const text = `CEQ: ${results.ceq}, CET: ${results.cet}, CE (AWS): ${results.ceAws}, PCM: ${results.pcm}, PREN: ${results.pren}`;
								await Clipboard.setStringAsync(text);
							}}
							style={styles.iconButton}
						>
							{Platform.OS === 'ios' ? (
								<SymbolView
									name="doc.on.doc"
									size={18}
									type="hierarchical"
									tintColor={colors.textSecondary}
								/>
							) : (
								<MaterialCommunityIcons
									name="content-copy"
									size={18}
									color={colors.textSecondary}
								/>
							)}
						</TouchableOpacity>
					)}
				</View>
				<View style={styles.resultsGrid}>
					<View style={styles.resultItem}>
						<Text style={styles.resultLabel}>CEQ</Text>
						<Text style={styles.resultValue}>{results.ceq}</Text>
					</View>
					<View style={styles.resultItem}>
						<Text style={styles.resultLabel}>CET</Text>
						<Text style={styles.resultValue}>{results.cet}</Text>
					</View>
					<View style={styles.resultItem}>
						<Text style={styles.resultLabel}>CE (AWS)</Text>
						<Text style={styles.resultValue}>{results.ceAws}</Text>
					</View>
					<View style={styles.resultItem}>
						<Text style={styles.resultLabel}>PCM</Text>
						<Text style={styles.resultValue}>{results.pcm}</Text>
					</View>
					<View style={styles.resultItem}>
						<Text style={styles.resultLabel}>PREN</Text>
						<Text style={styles.resultValue}>{results.pren}</Text>
					</View>
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
					{/* Input Fields */}
					<View style={styles.inputsContainer}>
						<View style={styles.column}>
							<InputField
								ref={carbonRef}
								label="Carbon (C)"
								value={carbon}
								onChangeText={setCarbon}
								returnKeyType="next"
								onSubmitEditing={() => manganeseRef.current?.focus()}
								accessibilityLabel="Carbon input field"
								accessibilityHint="Enter carbon percentage"
							/>
							<InputField
								ref={manganeseRef}
								label="Manganese (Mn)"
								value={manganese}
								onChangeText={setManganese}
								returnKeyType="next"
								onSubmitEditing={() => siliconRef.current?.focus()}
								accessibilityLabel="Manganese input field"
								accessibilityHint="Enter manganese percentage"
							/>
							<InputField
								ref={siliconRef}
								label="Silicon (Si)"
								value={silicon}
								onChangeText={setSilicon}
								returnKeyType="next"
								onSubmitEditing={() => chromiumRef.current?.focus()}
								accessibilityLabel="Silicon input field"
								accessibilityHint="Enter silicon percentage"
							/>
							<InputField
								ref={chromiumRef}
								label="Chromium (Cr)"
								value={chromium}
								onChangeText={setChromium}
								returnKeyType="next"
								onSubmitEditing={() => nickelRef.current?.focus()}
								accessibilityLabel="Chromium input field"
								accessibilityHint="Enter chromium percentage"
							/>
							<InputField
								ref={nickelRef}
								label="Nickel (Ni)"
								value={nickel}
								onChangeText={setNickel}
								returnKeyType="next"
								onSubmitEditing={() => molybdenumRef.current?.focus()}
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
								onSubmitEditing={() => copperRef.current?.focus()}
								accessibilityLabel="Molybdenum input field"
								accessibilityHint="Enter molybdenum percentage"
							/>
							<InputField
								ref={copperRef}
								label="Copper (Cu)"
								value={copper}
								onChangeText={setCopper}
								returnKeyType="next"
								onSubmitEditing={() => vanadiumRef.current?.focus()}
								accessibilityLabel="Copper input field"
								accessibilityHint="Enter copper percentage"
							/>
							<InputField
								ref={vanadiumRef}
								label="Vanadium (V)"
								value={vanadium}
								onChangeText={setVanadium}
								returnKeyType="next"
								onSubmitEditing={() => nitrogenRef.current?.focus()}
								accessibilityLabel="Vanadium input field"
								accessibilityHint="Enter vanadium percentage"
							/>
							<InputField
								ref={nitrogenRef}
								label="Nitrogen (N)"
								value={nitrogen}
								onChangeText={setNitrogen}
								returnKeyType="next"
								onSubmitEditing={() => boronRef.current?.focus()}
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
	headerButton: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
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
	resultsCard: {
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
	glassAndroidFallback: {
		backgroundColor: colors.surface,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
	},
	resultsHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: spacing.md,
	},
	resultsTitle: {
		...typography.title2,
		color: colors.text,
		flex: 1,
	},
	iconButton: {
		padding: spacing.xs,
	},
	resultsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginHorizontal: -spacing.sm,
	},
	resultItem: {
		width: '33.33%',
		paddingHorizontal: spacing.sm,
		marginBottom: spacing.md,
	},
	resultLabel: {
		...typography.caption1,
		color: colors.textSecondary,
		marginBottom: spacing.xs,
		...Platform.select({
			ios: {
				textTransform: 'uppercase',
				fontWeight: '600',
				letterSpacing: 0.5,
			},
		}),
	},
	resultValue: {
		...typography.title2,
		color: colors.primary,
		fontWeight: '700',
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
