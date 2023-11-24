// const path = require('path');
import path from 'path';
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import HtmlWebpackPlugin from "html-webpack-plugin";

export default {
	mode: "production",
	entry: './src/index.ts',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		]
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js', '.wasm'],
		// fallback: { "url": require.resolve("url/") }
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
	},
	plugins: [
		new HtmlWebpackPlugin({
			title: 'our project',
			template: 'src/index.html'
		})
	],
	devServer: {
		static: path.join(__dirname, "dist"),
		compress: true,
		port: 4000,
		headers: {
			"Cross-Origin-Opener-Policy": "same-origin",
			"Cross-Origin-Embedder-Policy": "require-corp",
		}
	},
};