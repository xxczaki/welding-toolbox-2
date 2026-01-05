import { useLayoutEffect, useRef, useState } from 'react';
import {
	Keyboard,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
	ELEMENT_LABELS,
	type ElementKey,
	INITIAL_ELEMENTS,
} from '../constants/weldability';
import { useWeldabilityCalculations } from '../hooks/useWeldabilityCalculations';
import {
	borderRadius,
	colors,
	commonStyles,
	spacing,
	typography,
} from '../theme';
import { copyToClipboard } from '../utils/clipboard';

const WeldabilityScreen = () => {
	const insets = useSafeAreaInsets();

	const [elements, setElements] = useState(INITIAL_ELEMENTS);

	const updateElement = (key: ElementKey, value: string) =>
		setElements((prev) => ({ ...prev, [key]: value }));

	// Refs for keyboard navigation
	const refs = useRef<Record<ElementKey, TextInput | null>>({
		carbon: null,
		manganese: null,
		silicon: null,
		chromium: null,
		nickel: null,
		molybdenum: null,
		copper: null,
		vanadium: null,
		nitrogen: null,
		boron: null,
	});

	const [resultsKey, setResultsKey] = useState(0);

	const {
		ceqResult,
		cetResult,
		ceAwsResult,
		pcmResult,
		prenResult,
		resultChips,
	} = useWeldabilityCalculations({ elements });

	const resetForm = () => {
		setElements(INITIAL_ELEMENTS);
		setResultsKey((k) => k + 1);
	};

	// Reset layout when results shrink (to fix scroll position issues)
	const totalResultLength =
		ceqResult.length +
		cetResult.length +
		ceAwsResult.length +
		pcmResult.length +
		prenResult.length;
	const prevLengthRef = useRef(totalResultLength);

	useLayoutEffect(() => {
		// Reset layout when total result length decreases (sync to avoid flicker)
		if (totalResultLength < prevLengthRef.current) {
			setResultsKey((k) => k + 1);
		}

		prevLengthRef.current = totalResultLength;
	}, [totalResultLength]);

	const hasInputs = Object.values(elements).some(Boolean);

	const renderInputRow = (
		leftKey: ElementKey,
		rightKey: ElementKey,
		nextLeftKey?: ElementKey,
	) => (
		<View style={styles.inputsRow}>
			<View style={styles.inputGroup}>
				<Text style={styles.inputLabel}>
					{ELEMENT_LABELS[leftKey].name} ({ELEMENT_LABELS[leftKey].symbol})
				</Text>
				<TextInput
					ref={(r) => {
						refs.current[leftKey] = r;
					}}
					style={styles.input}
					value={elements[leftKey]}
					onChangeText={(v) => updateElement(leftKey, v)}
					keyboardType="decimal-pad"
					placeholder="0"
					placeholderTextColor={colors.textSecondary}
					returnKeyType="next"
					onSubmitEditing={() => refs.current[rightKey]?.focus()}
				/>
			</View>
			<View style={styles.inputGroup}>
				<Text style={styles.inputLabel}>
					{ELEMENT_LABELS[rightKey].name} ({ELEMENT_LABELS[rightKey].symbol})
				</Text>
				<TextInput
					ref={(r) => {
						refs.current[rightKey] = r;
					}}
					style={styles.input}
					value={elements[rightKey]}
					onChangeText={(v) => updateElement(rightKey, v)}
					keyboardType="decimal-pad"
					placeholder="0"
					placeholderTextColor={colors.textSecondary}
					returnKeyType={nextLeftKey ? 'next' : 'done'}
					onSubmitEditing={() =>
						nextLeftKey && refs.current[nextLeftKey]?.focus()
					}
				/>
			</View>
		</View>
	);

	return (
		<View style={styles.container}>
			{/* Header */}
			<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
				<View style={styles.header}>
					<Text style={styles.headerTitle}>Weldability</Text>
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
			</TouchableWithoutFeedback>

			{/* Results Card */}
			<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
				<View style={styles.resultsCard}>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.resultsScrollContent}
					>
						<View key={resultsKey} style={styles.resultsRow}>
							{resultChips.map((chip) => (
								<TouchableOpacity
									key={chip.label}
									style={styles.resultItem}
									onPress={() => copyToClipboard(chip.value)}
									disabled={chip.value === '0'}
									activeOpacity={0.7}
								>
									<Text style={styles.resultLabel}>{chip.label}</Text>
									<Text
										style={[
											styles.resultValue,
											chip.value !== '0' && styles.resultValueActive,
										]}
									>
										{chip.value === '0' ? '—' : chip.value}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</ScrollView>
				</View>
			</TouchableWithoutFeedback>

			<ScrollView
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingBottom: insets.bottom + 100 },
				]}
				keyboardShouldPersistTaps="handled"
			>
				{/* Chemical Elements - Two Column Layout */}
				{renderInputRow('carbon', 'manganese', 'silicon')}
				{renderInputRow('silicon', 'chromium', 'nickel')}
				{renderInputRow('nickel', 'molybdenum', 'copper')}
				{renderInputRow('copper', 'vanadium', 'nitrogen')}
				{renderInputRow('nitrogen', 'boron')}
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
	resultsCard: {
		marginHorizontal: spacing.md,
		marginTop: spacing.md,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.sm,
		backgroundColor: colors.surface,
		borderRadius: borderRadius.xl,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
	},
	resultsScrollContent: {
		flexGrow: 1,
	},
	resultsRow: {
		flexDirection: 'row',
		flex: 1,
		gap: spacing.sm,
	},
	resultItem: {
		alignItems: 'center',
		flex: 1,
	},
	resultLabel: {
		...typography.caption1,
		color: colors.textSecondary,
		fontSize: 10,
		textTransform: 'uppercase',
		fontWeight: '600',
		marginBottom: 2,
	},
	resultValue: {
		fontSize: 17,
		fontWeight: 'bold',
		color: colors.textSecondary,
	},
	resultValueActive: {
		color: colors.primary,
	},
	scrollContent: {
		padding: spacing.md,
	},
	inputsRow: {
		flexDirection: 'row',
		gap: spacing.sm,
		marginBottom: spacing.sm,
	},
	inputGroup: {
		flex: 1,
	},
	inputLabel: {
		...typography.caption1,
		color: colors.textSecondary,
		marginBottom: spacing.xs,
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

export default WeldabilityScreen;
