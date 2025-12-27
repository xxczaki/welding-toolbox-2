const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Production optimizations
config.transformer = {
	...config.transformer,
	minifierConfig: {
		...config.transformer.minifierConfig,
		compress: {
			// Remove console.log in production bundles
			drop_console: true,
			// Remove debugger statements
			drop_debugger: true,
			// More aggressive optimization
			passes: 3,
		},
		mangle: {
			// Mangle variable names for smaller bundle
			toplevel: true,
		},
		output: {
			// Remove comments
			comments: false,
			// More compact output
			beautify: false,
		},
	},
};

module.exports = config;
