import { AlertDialog } from '@expo/ui/jetpack-compose';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

import { useHistoryExport } from '../../hooks/useHistoryExport';
import { useHistoryManagement } from '../../hooks/useHistoryManagement';
import {
	borderRadius,
	colors,
	commonStyles,
	spacing,
	typography,
} from '../../theme';
import type { HistoryEntry } from '../../types';
import {
	formatHistoryDate,
	getCustomFieldsFromEntry,
} from '../../utils/history';

const HistoryScreen = () => {
	const router = useRouter();
	const [clearDialogVisible, setClearDialogVisible] = useState(false);
	const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
	const [entryToDelete, setEntryToDelete] = useState<HistoryEntry | null>(null);

	const { settings, sortedHistory, hasHistory, deleteEntry, clearHistory } =
		useHistoryManagement();

	const { shareHistory } = useHistoryExport({ settings });

	const confirmClearHistory = () => {
		clearHistory();
		setClearDialogVisible(false);
	};

	const handleShareHistory = async () => {
		const result = await shareHistory();
		if (!result.success && result.error) {
			Alert.alert('Error', result.error);
		}
	};

	const handleDeletePress = (entry: HistoryEntry) => {
		setEntryToDelete(entry);
		setDeleteDialogVisible(true);
	};

	const confirmDeleteEntry = () => {
		if (entryToDelete) {
			deleteEntry(entryToDelete.id);
		}

		setDeleteDialogVisible(false);
		setEntryToDelete(null);
	};

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<MaterialCommunityIcons
						name="arrow-left"
						size={24}
						color={colors.text}
					/>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>History</Text>
				<View style={styles.headerActions}>
					<TouchableOpacity
						onPress={handleShareHistory}
						style={[
							styles.headerIconButton,
							!hasHistory && styles.headerButtonDisabled,
						]}
						disabled={!hasHistory}
					>
						<MaterialCommunityIcons
							name="share-variant"
							size={20}
							color={hasHistory ? colors.text : colors.textDisabled}
						/>
					</TouchableOpacity>
					{/* Note: Native Button from @expo/ui/jetpack-compose cuts off text regardless of size modifiers or wrapper Views */}
					<TouchableOpacity
						onPress={() => setClearDialogVisible(true)}
						style={[
							styles.headerTextButton,
							!hasHistory && styles.headerButtonDisabled,
						]}
						disabled={!hasHistory}
					>
						<Text
							style={[
								styles.headerTextButtonLabel,
								!hasHistory && styles.headerTextButtonLabelDisabled,
							]}
						>
							Clear
						</Text>
					</TouchableOpacity>
				</View>
			</View>

			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingBottom: 100, flexGrow: 1 },
				]}
			>
				{!hasHistory ? (
					<View style={styles.emptyState}>
						<MaterialCommunityIcons
							name="history"
							size={80}
							color={colors.textSecondary}
						/>
						<Text style={styles.emptyText}>No history yet</Text>
						<Text style={styles.emptySubtext}>
							Saved heat input results will appear here.
						</Text>
					</View>
				) : (
					sortedHistory.map((entry) => {
						const formattedDate = formatHistoryDate(entry.Date);
						const customFields = getCustomFieldsFromEntry(entry);

						return (
							<View key={entry.id} style={styles.historyCard}>
								<View style={styles.historyHeader}>
									<View style={styles.historyHeaderLeft}>
										<Text style={styles.historyResult}>
											{entry['Heat Input']}
										</Text>
										<Text style={styles.historyDate}>{formattedDate}</Text>
									</View>
									<TouchableOpacity
										onPress={() => handleDeletePress(entry)}
										style={styles.deleteButton}
									>
										<MaterialCommunityIcons
											name="delete-outline"
											size={24}
											color={colors.error}
										/>
									</TouchableOpacity>
								</View>
								<View style={styles.historyDetails}>
									{entry['Total energy'] !== 'N/A' ? (
										<>
											<Text style={styles.historyDetailText}>
												Total Energy: {entry['Total energy']}
											</Text>
											<Text style={styles.historyDetailText}>
												Length: {entry.Length}
											</Text>
										</>
									) : (
										<>
											<Text style={styles.historyDetailText}>
												Voltage: {entry.Voltage}V
											</Text>
											<Text style={styles.historyDetailText}>
												Amperage: {entry.Amperage}A
											</Text>
											<Text style={styles.historyDetailText}>
												Length: {entry.Length}
											</Text>
											<Text style={styles.historyDetailText}>
												Time: {entry.Time}
											</Text>
											<Text style={styles.historyDetailText}>
												Efficiency: {entry['Efficiency factor']}
											</Text>
										</>
									)}
									{/* Display travel speed if available */}
									{entry['Travel Speed'] && entry['Travel Speed'] !== 'N/A' && (
										<Text style={styles.historyDetailText}>
											Travel Speed: {entry['Travel Speed']}
										</Text>
									)}
									{/* Display custom fields */}
									{customFields.map(([key, value]) => (
										<Text key={key} style={styles.historyDetailText}>
											{key}: {value}
										</Text>
									))}
								</View>
							</View>
						);
					})
				)}
			</ScrollView>

			{/* Clear History Dialog */}
			<AlertDialog
				title="Clear History"
				text="This action will clear the whole result history and cannot be undone."
				visible={clearDialogVisible}
				onDismissPressed={() => setClearDialogVisible(false)}
				onConfirmPressed={confirmClearHistory}
				confirmButtonText="Clear All"
				dismissButtonText="Cancel"
			/>

			{/* Delete Entry Dialog */}
			<AlertDialog
				title="Delete Entry"
				text="Are you sure you want to delete this entry?"
				visible={deleteDialogVisible}
				onDismissPressed={() => {
					setDeleteDialogVisible(false);
					setEntryToDelete(null);
				}}
				onConfirmPressed={confirmDeleteEntry}
				confirmButtonText="Delete"
				dismissButtonText="Cancel"
			/>
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
	backButton: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerTitle: {
		...typography.largeTitle,
		color: colors.text,
		flex: 1,
		textAlign: 'center',
	},
	headerActions: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		minWidth: 80,
		gap: spacing.sm,
	},
	headerIconButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: colors.surfaceVariant,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerTextButton: {
		height: 36,
		paddingHorizontal: spacing.md,
		borderRadius: 18,
		backgroundColor: colors.surfaceVariant,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerButtonDisabled: {
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
	scrollContent: {
		padding: spacing.md,
	},
	emptyState: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: spacing.xxl * 2,
	},
	emptyText: {
		...typography.title2,
		color: colors.text,
		marginTop: spacing.lg,
	},
	emptySubtext: {
		...typography.body,
		color: colors.textSecondary,
		marginTop: spacing.xs,
	},
	historyCard: {
		borderRadius: borderRadius.lg,
		padding: spacing.md,
		marginBottom: spacing.sm,
		backgroundColor: colors.surface,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
	},
	historyHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: spacing.md,
	},
	historyHeaderLeft: {
		flex: 1,
	},
	historyResult: {
		...typography.title2,
		color: colors.primary,
		fontWeight: '700',
		marginBottom: spacing.xs,
	},
	historyDate: {
		...typography.caption1,
		color: colors.textSecondary,
	},
	deleteButton: {
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
	},
	historyDetails: {
		gap: spacing.xs,
	},
	historyDetailText: {
		...typography.callout,
		color: colors.text,
	},
});

export default HistoryScreen;
