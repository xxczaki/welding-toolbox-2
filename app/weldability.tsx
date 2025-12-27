import { GlassView } from 'expo-glass-effect';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { SymbolView } from 'expo-symbols';
import React, { useState, useEffect } from 'react';
import {
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
import { ceAws, ceq, cet, pcm, pren } from 'welding-utils';

import {
	borderRadius,
	colors,
	commonStyles,
	spacing,
	typography,
} from '../theme';

const WeldabilityScreen = () => {
	const insets = useSafeAreaInsets();

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
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Weldability</Text>
				{hasInputs && (
					<TouchableOpacity onPress={resetForm} style={styles.headerButton}>
						<Text style={styles.headerButtonText}>Clear</Text>
					</TouchableOpacity>
				)}
			</View>

			{/* Results Card - Fixed at top */}
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
							paddingBottom: Platform.OS === 'ios' ? insets.bottom + 90 : 20,
						},
					]}
					keyboardShouldPersistTaps="handled"
				>
					{/* Input Fields */}
					<View style={styles.inputsContainer}>
						<View style={styles.column}>
							<InputField
								label="Carbon (C)"
								value={carbon}
								onChangeText={setCarbon}
							/>
							<InputField
								label="Manganese (Mn)"
								value={manganese}
								onChangeText={setManganese}
							/>
							<InputField
								label="Silicon (Si)"
								value={silicon}
								onChangeText={setSilicon}
							/>
							<InputField
								label="Chromium (Cr)"
								value={chromium}
								onChangeText={setChromium}
							/>
							<InputField
								label="Nickel (Ni)"
								value={nickel}
								onChangeText={setNickel}
							/>
						</View>
						<View style={styles.column}>
							<InputField
								label="Molybdenum (Mo)"
								value={molybdenum}
								onChangeText={setMolybdenum}
							/>
							<InputField
								label="Copper (Cu)"
								value={copper}
								onChangeText={setCopper}
							/>
							<InputField
								label="Vanadium (V)"
								value={vanadium}
								onChangeText={setVanadium}
							/>
							<InputField
								label="Nitrogen (N)"
								value={nitrogen}
								onChangeText={setNitrogen}
							/>
							<InputField
								label="Boron (B)"
								value={boron}
								onChangeText={setBoron}
							/>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</View>
	);
};

// Reusable Input Field Component
const InputField = ({
	label,
	value,
	onChangeText,
}: {
	label: string;
	value: string;
	onChangeText: (text: string) => void;
}) => (
	<View style={styles.inputContainer}>
		<Text style={styles.inputLabel}>{label}</Text>
		<TextInput
			style={styles.input}
			value={value}
			onChangeText={onChangeText}
			keyboardType="decimal-pad"
			maxLength={10}
			placeholder="0"
			placeholderTextColor={colors.textSecondary}
		/>
	</View>
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
