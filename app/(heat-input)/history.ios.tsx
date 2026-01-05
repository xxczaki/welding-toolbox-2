import {
	Button,
	Host,
	HStack,
	List,
	Section,
	Spacer,
	Image as SwiftImage,
	Text,
	VStack,
} from '@expo/ui/swift-ui';
import { frame, glassEffect } from '@expo/ui/swift-ui/modifiers';
import { useRouter } from 'expo-router';
import {
	Alert,
	Keyboard,
	Text as RNText,
	StyleSheet,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHistoryExport } from '../../hooks/useHistoryExport';
import { useHistoryManagement } from '../../hooks/useHistoryManagement';
import { colors, spacing } from '../../theme';
import {
	formatHistoryDate,
	getCustomFieldsFromEntry,
} from '../../utils/history';

const HistoryScreen = () => {
	const router = useRouter();
	const insets = useSafeAreaInsets();

	const { settings, sortedHistory, hasHistory, deleteEntry, clearHistory } =
		useHistoryManagement();

	const { shareHistory } = useHistoryExport({ settings });

	const handleClearHistory = () => {
		Alert.alert(
			'Clear History',
			'This action will clear the whole result history and cannot be undone.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Clear All',
					style: 'destructive',
					onPress: clearHistory,
				},
			],
		);
	};

	const handleShareHistory = async () => {
		const result = await shareHistory();

		if (!result.success && result.error) {
			Alert.alert('Error', result.error);
		}
	};

	const deleteEntryAtIndex = (index: number) => {
		const entry = sortedHistory[index];

		if (entry) {
			deleteEntry(entry.id);
		}
	};

	return (
		<View style={styles.container}>
			<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
				<View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
					<Host matchContents>
						<Button
							systemImage="chevron.left"
							color="white"
							onPress={() => router.back()}
							modifiers={[
								frame({ width: 36, height: 36 }),
								glassEffect({ shape: 'circle' }),
							]}
						/>
					</Host>
					<RNText style={styles.headerTitle}>History</RNText>
					<View style={{ flexDirection: 'row', gap: 8 }}>
						<Host matchContents>
							<Button
								systemImage="square.and.arrow.up"
								color="white"
								disabled={!hasHistory}
								onPress={handleShareHistory}
								modifiers={[
									frame({ width: 36, height: 36 }),
									glassEffect({ shape: 'circle' }),
								]}
							/>
						</Host>
						<Host style={{ width: 70, height: 36 }}>
							<Button
								onPress={handleClearHistory}
								variant="glass"
								disabled={!hasHistory}
							>
								<Text size={18}>Clear</Text>
							</Button>
						</Host>
					</View>
				</View>
			</TouchableWithoutFeedback>

			{/* Empty State */}
			{!hasHistory && (
				<View style={styles.emptyState}>
					<Host matchContents>
						<SwiftImage
							systemName="clock.arrow.circlepath"
							size={80}
							color="secondary"
						/>
					</Host>
					<RNText style={styles.emptyTitle}>No history yet</RNText>
					<RNText style={styles.emptySubtitle}>
						Saved heat input results will appear here.
					</RNText>
				</View>
			)}

			{hasHistory && (
				<Host style={styles.listHost}>
					<List
						listStyle="insetGrouped"
						deleteEnabled
						onDeleteItem={deleteEntryAtIndex}
					>
						<Section>
							{sortedHistory.map((entry) => {
								const formattedDate = formatHistoryDate(entry.Date);
								const customFields = getCustomFieldsFromEntry(entry);

								return (
									<VStack key={entry.id} alignment="leading" spacing={2}>
										<HStack>
											<Text size={17} weight="semibold" color="#ff9800">
												{entry['Heat Input']}
											</Text>
											<Spacer />
											<Text size={13} color="secondary">
												{formattedDate}
											</Text>
										</HStack>

										{entry['Total energy'] !== 'N/A' ? (
											<>
												<Text size={14} color="secondary">
													{`Total Energy: ${entry['Total energy']}`}
												</Text>
												<Text size={14} color="secondary">
													{`Length: ${entry.Length}`}
												</Text>
											</>
										) : (
											<>
												<Text size={14} color="secondary">
													{`Voltage: ${entry.Voltage}V`}
												</Text>
												<Text size={14} color="secondary">
													{`Amperage: ${entry.Amperage}A`}
												</Text>
												<Text size={14} color="secondary">
													{`Length: ${entry.Length}`}
												</Text>
												<Text size={14} color="secondary">
													{`Time: ${entry.Time}`}
												</Text>
												<Text size={14} color="secondary">
													{`Efficiency: ${entry['Efficiency factor']}`}
												</Text>
											</>
										)}

										{/* Travel Speed */}
										{entry['Travel Speed'] &&
											entry['Travel Speed'] !== 'N/A' && (
												<Text size={14} color="secondary">
													{`Travel Speed: ${entry['Travel Speed']}`}
												</Text>
											)}

										{/* Custom Fields */}
										{customFields.map(([key, value]) => (
											<Text key={key} size={14} color="secondary">
												{`${key}: ${value}`}
											</Text>
										))}
									</VStack>
								);
							})}
						</Section>
					</List>
				</Host>
			)}
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
		fontSize: 28,
		fontWeight: 'bold',
		color: colors.text,
	},
	emptyState: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: spacing.xl,
		marginTop: -120,
	},
	emptyTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: colors.textSecondary,
		marginTop: spacing.md,
	},
	emptySubtitle: {
		fontSize: 15,
		color: colors.textSecondary,
		marginTop: spacing.xs,
		textAlign: 'center',
	},
	listHost: {
		flex: 1,
	},
});

export default HistoryScreen;
