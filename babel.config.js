module.exports = (api) => {
	api.cache(true);

	return {
		presets: ['babel-preset-expo'],
		plugins: ['react-native-reanimated/plugin'],
		env: {
			production: {
				plugins: [
					// Remove console.log in production builds, but keep error and warn
					['transform-remove-console', { exclude: ['error', 'warn'] }],
				],
			},
		},
	};
};
