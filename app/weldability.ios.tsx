import { Button, Host, HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
	fixedSize,
	frame,
	glassEffect,
	padding,
} from '@expo/ui/swift-ui/modifiers';
import React, { useLayoutEffect, useRef, useState } from 'react';
import {
	Keyboard,
	Text as RNText,
	ScrollView,
	StyleSheet,
	TextInput,
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
import { borderRadius, colors, spacing } from '../theme';
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
				<RNText style={styles.inputLabel}>
					{ELEMENT_LABELS[leftKey].name} ({ELEMENT_LABELS[leftKey].symbol})
				</RNText>
				<View style={styles.inputWrapper}>
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
			</View>
			<View style={styles.inputGroup}>
				<RNText style={styles.inputLabel}>
					{ELEMENT_LABELS[rightKey].name} ({ELEMENT_LABELS[rightKey].symbol})
				</RNText>
				<View style={styles.inputWrapper}>
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
		</View>
	);

	return (
		<View style={styles.container}>
			{/* Header */}
			<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
				<View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
					<RNText style={styles.headerTitle}>Weldability</RNText>
					<Host style={{ width: 70, height: 36 }}>
						<Button onPress={resetForm} variant="glass" disabled={!hasInputs}>
							<Text size={18}>Clear</Text>
						</Button>
					</Host>
				</View>
			</TouchableWithoutFeedback>

			<View style={styles.resultsCardWrapper}>
				<Host style={styles.resultsHost}>
					<VStack
						modifiers={[
							padding({ vertical: 12 }),
							glassEffect({
								glass: { variant: 'regular' },
							}),
						]}
					>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.resultsScrollContent}
						>
							<Host
								key={resultsKey}
								matchContents
								style={styles.resultsInnerHost}
							>
								<HStack>
									{resultChips.map((chip) => (
										<React.Fragment key={chip.label}>
											<Spacer />
											<Button
												variant="plain"
												onPress={() => copyToClipboard(chip.value)}
											>
												<VStack
													spacing={2}
													alignment="center"
													modifiers={[
														frame({ minWidth: 50 }),
														fixedSize({ horizontal: true }),
													]}
												>
													<Text size={10} weight="semibold" color="secondary">
														{chip.label}
													</Text>
													<Text
														size={17}
														weight="bold"
														color={chip.value !== '0' ? '#ff9800' : 'secondary'}
													>
														{chip.value === '0' ? '—' : chip.value}
													</Text>
												</VStack>
											</Button>
										</React.Fragment>
									))}
									<Spacer />
								</HStack>
							</Host>
						</ScrollView>
					</VStack>
				</Host>
			</View>

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
	resultsCardWrapper: {
		marginHorizontal: spacing.md,
		marginBottom: spacing.md,
	},
	resultsHost: {
		height: 60,
	},
	resultsScrollContent: {
		flexGrow: 1,
	},
	resultsInnerHost: {
		overflow: 'visible',
		flex: 1,
		minWidth: '100%',
	},
	scrollContent: {
		paddingHorizontal: spacing.md,
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
		fontSize: 13,
		color: colors.textSecondary,
		marginBottom: spacing.xs,
	},
	inputWrapper: {
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
});

export default WeldabilityScreen;
