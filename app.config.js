const IS_PRODUCTION = process.env.NODE_ENV === 'production';

module.exports = {
	expo: {
		scheme: 'weldingtoolbox2',
		name: 'Welding Toolbox 2',
		developmentClient: {
			silentLaunch: true,
		},
		slug: 'weldingtoolbox2',
		version: '2.0.0',
		icon: 'assets/images/icon.png',
		android: {
			package: 'me.kepinski.weldingtoolbox2',
			playStoreUrl:
				'https://play.google.com/store/apps/details?id=me.kepinski.weldingtoolbox2',
			adaptiveIcon: {
				foregroundImage: 'assets/images/foreground.png',
				monochromeImage: 'assets/images/foreground.png',
				backgroundColor: '#ff9800',
			},
			versionCode: 3145772,
			userInterfaceStyle: 'dark',
			// Only block permissions in production builds
			blockedPermissions: IS_PRODUCTION
				? [
						'android.permission.INTERNET',
						'android.permission.ACCESS_NETWORK_STATE',
						'android.permission.SYSTEM_ALERT_WINDOW',
						'android.permission.VIBRATE',
						'android.permission.READ_EXTERNAL_STORAGE',
						'android.permission.WRITE_EXTERNAL_STORAGE',
					]
				: [
						// Still block unnecessary permissions in development
						'android.permission.SYSTEM_ALERT_WINDOW',
						'android.permission.VIBRATE',
						'android.permission.READ_EXTERNAL_STORAGE',
						'android.permission.WRITE_EXTERNAL_STORAGE',
					],
		},
		ios: {
			bundleIdentifier: 'me.kepinski.weldingtoolbox2',
			appleTeamId: '34P8Q35U2Y',
			appStoreUrl:
				'https://apps.apple.com/us/app/welding-toolbox-2/id1546617906',
			buildNumber: '4',
			supportsTablet: true,
			infoPlist: {
				ITSAppUsesNonExemptEncryption: false,
				UIUserInterfaceStyle: 'Dark',
			},
		},
		githubUrl: 'https://github.com/xxczaki/welding-toolbox-2',
		userInterfaceStyle: 'dark',
		backgroundColor: '#212121',
		primaryColor: '#ff9800',
		splash: {
			image: 'assets/images/splash.png',
			backgroundColor: '#212121',
			resizeMode: 'contain',
		},
		extra: {
			eas: {
				projectId: '3e28a9e9-36c3-4129-ba51-629ae79ad022',
			},
		},
		plugins: [
			'expo-router',
			[
				'expo-build-properties',
				{
					android: {
						enableProguardInReleaseBuilds: true,
						enableShrinkResourcesInReleaseBuilds: true,
						extraProguardRules:
							'-keep class com.swmansion.reanimated.** { *; }\n-keep class com.facebook.react.turbomodule.** { *; }',
						useLegacyPackaging: false,
						packagingOptions: {
							pickFirst: [],
							exclude: [],
						},
					},
					ios: {
						deploymentTarget: '15.1',
					},
				},
			],
		],
	},
};
