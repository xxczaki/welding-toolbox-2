import { Platform, StyleSheet } from 'react-native';

// Color palette
export const colors = {
	// Primary colors
	primary: '#ff9800',
	primaryLight: '#ffb74d',
	primaryDark: '#f57c00',

	// Background colors
	background: Platform.select({
		ios: '#000000',
		android: '#121212',
	}),
	surface: Platform.select({
		ios: '#1c1c1e',
		android: '#1e1e1e',
	}),
	surfaceVariant: Platform.select({
		ios: '#2c2c2e',
		android: '#2a2a2a',
	}),

	// Text colors
	text: '#ffffff',
	textSecondary: Platform.select({
		ios: '#98989d',
		android: '#b3b3b3',
	}),
	textDisabled: '#666666',

	// Status colors
	success: '#4caf50',
	error: '#f44336',
	warning: '#ff9800',

	// Border colors
	border: Platform.select({
		ios: '#38383a',
		android: '#333333',
	}),
	divider: Platform.select({
		ios: '#38383a',
		android: '#2a2a2a',
	}),
};

// Typography
export const typography = {
	largeTitle: {
		fontSize: Platform.select({ ios: 34, android: 32 }),
		fontWeight: '700' as const,
		letterSpacing: Platform.select({ ios: 0.37, android: 0 }),
	},
	title1: {
		fontSize: Platform.select({ ios: 28, android: 24 }),
		fontWeight: '700' as const,
		letterSpacing: Platform.select({ ios: 0.36, android: 0 }),
	},
	title2: {
		fontSize: Platform.select({ ios: 22, android: 20 }),
		fontWeight: '600' as const,
		letterSpacing: Platform.select({ ios: 0.35, android: 0 }),
	},
	title3: {
		fontSize: Platform.select({ ios: 20, android: 18 }),
		fontWeight: '600' as const,
		letterSpacing: Platform.select({ ios: 0.38, android: 0 }),
	},
	headline: {
		fontSize: 17,
		fontWeight: '600' as const,
		letterSpacing: Platform.select({ ios: -0.41, android: 0 }),
	},
	body: {
		fontSize: 17,
		fontWeight: '400' as const,
		letterSpacing: Platform.select({ ios: -0.41, android: 0 }),
	},
	callout: {
		fontSize: 16,
		fontWeight: '400' as const,
		letterSpacing: Platform.select({ ios: -0.32, android: 0 }),
	},
	subheadline: {
		fontSize: 15,
		fontWeight: '400' as const,
		letterSpacing: Platform.select({ ios: -0.24, android: 0 }),
	},
	footnote: {
		fontSize: 13,
		fontWeight: '400' as const,
		letterSpacing: Platform.select({ ios: -0.08, android: 0 }),
	},
	caption1: {
		fontSize: 12,
		fontWeight: '400' as const,
		letterSpacing: Platform.select({ ios: 0, android: 0 }),
	},
	caption2: {
		fontSize: 11,
		fontWeight: '400' as const,
		letterSpacing: Platform.select({ ios: 0.07, android: 0 }),
	},
};

// Spacing
export const spacing = {
	xs: 4,
	sm: 8,
	md: 16,
	lg: 24,
	xl: 32,
	xxl: 48,
};

// Border radius
export const borderRadius = {
	sm: Platform.select({ ios: 8, android: 4 }),
	md: Platform.select({ ios: 10, android: 8 }),
	lg: Platform.select({ ios: 12, android: 12 }),
	xl: Platform.select({ ios: 16, android: 16 }),
	round: 9999,
};

// Common component styles
export const commonStyles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	card: {
		backgroundColor: colors.surface,
		borderRadius: borderRadius.lg,
		padding: spacing.md,
		marginBottom: spacing.md,
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.25,
				shadowRadius: 3.84,
			},
			android: {
				elevation: 5,
			},
		}),
	},
	input: {
		backgroundColor: colors.surfaceVariant,
		borderRadius: borderRadius.md,
		padding: spacing.md,
		color: colors.text,
		fontSize: 17,
		...Platform.select({
			ios: {
				paddingVertical: 12,
			},
			android: {
				paddingVertical: 8,
			},
		}),
	},
	inputLabel: {
		...typography.subheadline,
		color: colors.textSecondary,
		marginBottom: spacing.xs,
		...Platform.select({
			ios: {
				textTransform: 'uppercase' as const,
				fontSize: 13,
				fontWeight: '600' as const,
				letterSpacing: -0.08,
			},
		}),
	},
	button: {
		backgroundColor: colors.primary,
		borderRadius: borderRadius.md,
		padding: spacing.md,
		alignItems: 'center' as const,
		justifyContent: 'center' as const,
		...Platform.select({
			ios: {
				paddingVertical: 12,
			},
			android: {
				elevation: 2,
			},
		}),
	},
	buttonText: {
		...typography.headline,
		color: '#000000',
		fontWeight: '600' as const,
	},
	secondaryButton: {
		backgroundColor: colors.surfaceVariant,
		borderRadius: borderRadius.md,
		padding: spacing.md,
		alignItems: 'center' as const,
		justifyContent: 'center' as const,
	},
	secondaryButtonText: {
		...typography.headline,
		color: colors.primary,
		fontWeight: '600' as const,
	},
});
