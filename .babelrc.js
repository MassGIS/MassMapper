const path = require('path');

const context = path.resolve(__dirname, 'packages');
const isTest = process.env.NODE_ENV === 'test';

module.exports = {
	plugins: [
		[
			'react-css-modules',
			{
				autoResolveMultipleImports: true,
				exclude: '^(?!.*module).+\\.(css)$',
				generateScopedName: '[local]__[hash:base64:5]',
				context: context,
			},
		],
		'@babel/plugin-proposal-async-generator-functions',
		'@babel/plugin-proposal-object-rest-spread',
		['transform-class-properties', { loose: true }],
		["@babel/plugin-proposal-class-properties", { "loose": false }],
		'lodash',
	],
	presets: [
		[
			'@babel/preset-env',
			{
				modules: isTest ? 'commonjs' : false,
				targets: {
					browsers: ['>0.25%', 'not op_mini all'],
				},
			},
		],
		'@babel/preset-react',
		'@babel/preset-flow',
	],
};
