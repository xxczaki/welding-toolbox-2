import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { SymbolView } from 'expo-symbols';
import { nanoid } from 'nanoid/non-secure';
import { useEffect, useState } from 'react';
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as XLSX from 'xlsx';
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

const HistoryScreen = () => {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [settings, setSettings] = useState<Settings>({});

	useEffect(() => {
		(async () => {
			const data = await storage.getItem('settings');
			if (data) {
				setSettings(JSON.parse(data));
			}
		})();
	}, []);

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

	const clearHistory = () => {
		Alert.alert(
			'Clear History',
			'This action will clear the whole result history and cannot be undone.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Clear All',
					style: 'destructive',
					onPress: () => {
						setSettings({ ...settings, resultHistory: [] });
					},
				},
			],
		);
	};

	const shareHistory = async () => {
		if (!settings?.resultHistory) return;

		try {
			const newArray = [...settings.resultHistory].sort(
				(a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime(),
			);

			const ws = XLSX.utils.json_to_sheet(newArray);
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, 'WeldingToolbox2History');

			const id = nanoid(5);

			const wbout = XLSX.write(wb, {
				type: 'base64',
				bookType: 'xlsx',
			});
			const filePath = `${FileSystem.documentDirectory}result-history-${id}.xlsx`;
			await FileSystem.writeAsStringAsync(filePath, wbout, {
				encoding: 'base64',
			});

			if (!(await Sharing.isAvailableAsync())) {
				Alert.alert('Error', 'Sharing is not available on this device');
				return;
			}

			await Sharing.shareAsync(filePath, {
				mimeType:
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				dialogTitle: 'Result history',
				UTI: 'com.microsoft.excel.xlsx',
			});
		} catch {
			Alert.alert('Error', 'Failed to export history. Please try again.');
		}
	};

	const deleteEntry = (entry: HistoryEntry) => {
		Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete',
				style: 'destructive',
				onPress: () => {
					setSettings({
						...settings,
						resultHistory: settings?.resultHistory?.filter(
							(item) => item.id !== entry.id,
						),
					});
				},
			},
		]);
	};

	const hasHistory = (settings?.resultHistory?.length ?? 0) > 0;

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<View style={styles.backButtonContainer}>
					<GlassView
						glassEffectStyle="clear"
						style={[
							styles.liquidGlassButtonCircular,
							Platform.OS === 'android' && styles.glassButtonAndroidFallback,
						]}
					>
						<TouchableOpacity
							onPress={() => router.back()}
							style={styles.circularButton}
						>
							{Platform.OS === 'ios' ? (
								<SymbolView
									name="chevron.left"
									size={20}
									type="hierarchical"
									tintColor={colors.text}
								/>
							) : (
								<MaterialCommunityIcons
									name="arrow-left"
									size={24}
									color={colors.text}
								/>
							)}
						</TouchableOpacity>
					</GlassView>
				</View>
				<Text style={styles.headerTitle}>History</Text>
				<View style={styles.headerActions}>
					{hasHistory && (
						<>
							<GlassView
								glassEffectStyle="clear"
								style={[
									styles.liquidGlassButtonSmall,
									Platform.OS === 'android' &&
										styles.glassButtonAndroidFallback,
								]}
							>
								<TouchableOpacity
									onPress={shareHistory}
									style={styles.smallCircularButton}
								>
									{Platform.OS === 'ios' ? (
										<SymbolView
											name="square.and.arrow.up"
											size={22}
											type="hierarchical"
											tintColor={colors.text}
											style={styles.icon}
										/>
									) : (
										<MaterialCommunityIcons
											name="share-variant"
											size={22}
											color={colors.text}
										/>
									)}
								</TouchableOpacity>
							</GlassView>
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
									onPress={clearHistory}
									style={styles.headerTextButton}
								>
									<Text style={styles.clearButtonText}>Clear</Text>
								</TouchableOpacity>
							</GlassView>
						</>
					)}
				</View>
			</View>

			<KeyboardAvoidingView
				enabled
				style={{ flex: 1 }}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<ScrollView
					contentContainerStyle={[
						styles.scrollContent,
						{
							paddingBottom: Platform.OS === 'ios' ? insets.bottom + 90 : 20,
						},
					]}
				>
					{!hasHistory ? (
						<View style={styles.emptyState}>
							{Platform.OS === 'ios' ? (
								<SymbolView
									name="clock.arrow.circlepath"
									size={80}
									type="hierarchical"
									tintColor={colors.textSecondary}
									style={styles.iconEmpty}
								/>
							) : (
								<MaterialCommunityIcons
									name="history"
									size={80}
									color={colors.textSecondary}
								/>
							)}
							<Text style={styles.emptyText}>No history yet</Text>
							<Text style={styles.emptySubtext}>
								Saved calculations will appear here
							</Text>
						</View>
					) : (
						settings?.resultHistory
							?.slice()
							.sort(
								(a, b) =>
									new Date(b.Date).getTime() - new Date(a.Date).getTime(),
							)
							.map((entry) => (
								<GlassView
									key={entry.id}
									glassEffectStyle="clear"
									style={[
										styles.historyCard,
										Platform.OS === 'android' &&
											styles.glassCardAndroidFallback,
									]}
								>
									<View style={styles.historyHeader}>
										<View style={styles.historyHeaderLeft}>
											<Text style={styles.historyResult}>
												{entry['Heat Input']}
											</Text>
											<Text style={styles.historyDate}>{entry.Date}</Text>
										</View>
										<GlassView
											glassEffectStyle="clear"
											style={[
												styles.deleteButtonGlass,
												Platform.OS === 'android' &&
													styles.glassButtonAndroidFallback,
											]}
										>
											<TouchableOpacity
												onPress={() => deleteEntry(entry)}
												style={styles.deleteButton}
											>
												{Platform.OS === 'ios' ? (
													<SymbolView
														name="trash"
														size={18}
														type="hierarchical"
														tintColor={colors.error}
														style={styles.iconSmall}
													/>
												) : (
													<MaterialCommunityIcons
														name="delete-outline"
														size={18}
														color={colors.error}
													/>
												)}
											</TouchableOpacity>
										</GlassView>
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
										{/* Display custom fields */}
										{Object.entries(entry)
											.filter(
												([key]) =>
													![
														'id',
														'Date',
														'Amperage',
														'Voltage',
														'Total energy',
														'Length',
														'Time',
														'Efficiency factor',
														'Heat Input',
													].includes(key),
											)
											.map(([key, value]) => (
												<Text key={key} style={styles.historyDetailText}>
													{key}: {value}
												</Text>
											))}
									</View>
								</GlassView>
							))
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
		paddingTop: Platform.OS === 'ios' ? (isIPad() ? 110 : 60) : 32,
		paddingBottom: spacing.md,
		backgroundColor: colors.background,
		...Platform.select({
			ios: isIPad()
				? {
						paddingHorizontal: spacing.xxl * 2,
					}
				: {},
		}),
	},
	backButtonContainer: {
		width: 50,
	},
	liquidGlassButtonCircular: {
		width: 40,
		height: 40,
		borderRadius: 20,
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
	liquidGlassButtonSmall: {
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
	circularButton: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	smallCircularButton: {
		width: 36,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerTextButton: {
		height: 36,
		paddingHorizontal: spacing.md,
		alignItems: 'center',
		justifyContent: 'center',
	},
	clearButtonText: {
		...typography.body,
		color: colors.text,
		fontSize: 15,
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
		minWidth: 50,
	},
	scrollContent: {
		padding: spacing.md,
		...Platform.select({
			ios: isIPad()
				? {
						paddingHorizontal: spacing.xxl * 2,
					}
				: {},
		}),
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
	deleteButtonGlass: {
		width: 32,
		height: 32,
		borderRadius: 16,
		overflow: 'hidden',
	},
	deleteButton: {
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
	},
	iconLarge: {
		width: 28,
		height: 28,
	},
	icon: {
		width: 22,
		height: 22,
	},
	iconSmall: {
		width: 20,
		height: 20,
	},
	iconEmpty: {
		width: 80,
		height: 80,
	},
	historyDetails: {
		gap: spacing.xs,
	},
	historyDetailText: {
		...typography.callout,
		color: colors.text,
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

export default HistoryScreen;
