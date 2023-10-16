const path = require('path');

module.exports = {
	entry: './src/index.ts',
	mode: "development",
	// context: path.resolve(__dirname, "."),
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			// {
			// 	test: /zenoh-wasm\.js$/,
			// 	loader: `exports-loader`,
			// 	options: {
			// 		type: `module`,
			// 		// this MUST be equivalent to EXPORT_NAME in complile.sh
			// 		exports: `zenoh-wasm`,
			// 	},
			// },
			// wasm files should not be processed but just be emitted and we want
			// to have their public URL.
			// {
			// 	test: /\.wasm$/,
			// 	type: "file-loader"
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