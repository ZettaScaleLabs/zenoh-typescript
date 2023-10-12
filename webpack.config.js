const path = require('path');
const webpack = require("webpack");

module.exports = {
	entry: './src/index.ts',
	mode: "development",
	context: path.resolve(__dirname, "."),
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /zenoh-wasm\.js$/,
				loader: "exports-loader"
			},
			// wasm files should not be processed but just be emitted and we want
			// to have their public URL.
			// {
			// 	test: /zenoh-wasm\.wasm$/,
			// 	type: "javascript/auto",
			// 	loader: "file-loader",
			// 	options: {
			// 		publicPath: "dist/"
			// 	}
			// }
		]
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
		fallback: {
			fs: false,
			path: false
		}
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
	}
};