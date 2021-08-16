const merge = require('webpack-merge');
const path = require('path');

const dev = require('../../webpack.dev.js');
const prod = require('../../webpack.prod.js');

const HtmlWebpackPlugin = require('html-webpack-plugin');

const bundles = {
	entry: {
		massmapperApp: [
			'@babel/polyfill',
			path.resolve(__dirname, './src/MassMapperApp.entry.tsx')
		],
	},
	node: {
		// fs: 'empty',
	},
	plugins: [
		// HTML Generation: Snowops Staff Manager (non-admin)
		new HtmlWebpackPlugin({
			title: 'MassMapper',
			template: path.join(__dirname, '../../static/basic.template.html'),
			filename: '../../htdocs/MassMapper.html', // relative to webpack.config.output.path
			hash: true,
			inject: 'head',
			// favicon: path.join(__dirname, '../../static/favicon.ico'),
			chunks: ['massmapperApp'],
			scriptLoading: 'defer'
		}),
	]
};

if (process.env.NODE_ENV === 'development') {
	module.exports = merge(dev, bundles);
} else {
	module.exports = merge(prod, bundles);
}
