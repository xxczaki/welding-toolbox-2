module.exports = (api) => {
	api.cache(true);

	return {
		presets: ['babel-preset-expo'],
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
