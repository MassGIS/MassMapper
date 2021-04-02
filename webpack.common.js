const buildMode = process.env.NODE_ENV;
const execa = require('execa');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const gitDirty = execa.sync('git', ['status', '-s', '-uall']).stdout.length > 0;
const gitHash = execa.sync('git', ['rev-parse', '--short', 'HEAD']).stdout;
const gitNumCommits = Number(execa.sync('git', ['rev-list', 'HEAD', '--count']).stdout);
const gitBranch = execa.sync('git', ['rev-parse', '--abbrev-ref', 'HEAD']).stdout;
const gitTag = execa.sync('git', ['describe','--tags']).stdout;

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const WebpackVersionFilePlugin = require('webpack-version-file-plugin');

const context = path.resolve(__dirname, 'packages');
const babelOptions = require('./.babelrc');

module.exports = {
	context,

	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, './htdocs/dist'),
		pathinfo: false,
		// publicPath: '/dist/',
	},

	resolve: {
		// Look for modules in these places...
		modules: ['node_modules'],

		// Settings so filename extension isn't required when importing.
		extensions: ['.ts', '.tsx', '.js', '.jsx'],
	},

	module: {
		rules: [
			// Typescript
			{
				test: /\.(ts|tsx)$/,
				exclude: '/node_modules/',
				use: [
					{
						loader: 'babel-loader?cacheDirectory',
						options: babelOptions,
					},
					{
						loader: 'ts-loader',
						options: {
							transpileOnly: true,
							experimentalWatchApi: true,
						},
					},
				],
			},
			// Javascript
			{
				test: /\.(js|jsx)$/,
				exclude: [/node_modules/],
				use: [
					{
						loader: 'babel-loader?cacheDirectory',
						options: babelOptions,
					},
				],
			},

			// CSS
			{
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: 'css-loader',
					}
				],
			},
			{
				test: /\.jpe?g$|\.gif$|\.ico$|\.png$|\.svg$/,
				use: 'file-loader?name=[name].[ext]?[hash]',
			},
			{
				test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
				loader: 'url-loader?limit=10000&mimetype=application/font-woff',
			},
			{
				test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
				loader: 'file-loader',
			},
			{
				test: /\.otf(\?.*)?$/,
				use: 'file-loader?name=/fonts/[name].  [ext]&mimetype=application/font-otf',
			},
		],
	},

	plugins: [
		new ForkTsCheckerWebpackPlugin({
			reportFiles: ['**/*.{ts,tsx}'],
			tsconfig: path.join(__dirname, 'tsconfig.json'),
			tslint: path.join(__dirname, 'tslint.json'),
			workers: ForkTsCheckerWebpackPlugin.ONE_CPU,
		}),

		new WebpackVersionFilePlugin({
			packageFile: path.join(__dirname, 'package.json'),
			template: path.join(path.join(__dirname, './static/'), 'version.ejs'),
			outputFile: path.join(__dirname, 'version.json'),
			extras: {
				githash: gitHash,
				gitNumCommits,
				gitBranch,
				gitTag,
				timestamp: Date.now(),
				dirty: gitDirty,
				buildMode,
			},
		}),

		new MiniCssExtractPlugin({
			filename: '[name].bundle.css',
			chunkFilename: '[id].css',
		}),
	],
};
