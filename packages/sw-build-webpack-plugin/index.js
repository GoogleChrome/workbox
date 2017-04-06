const swBuild = require('sw-build');
const path = require('path');
const SERVICE_WORKER_NAME = 'sw.js';

/**
 * Use the instance of this in the plugins array of the webpack config.
 * @example
 * const SwBuildWebpackPlugin = require('sw-build-webpack-plugin');
 * .
 * .
 * plugins: [
 * 	new SwBuildWebpackPlugin({
 * 		rootDirectory: './build/',
 * 		dest: './build/sw.js',
 * 		globPatterns: ['**\/*.{html,js,css}'],
 * 		globIgnores: ['admin.html'],
 * 		templatedUrls: {
 * 			'/shell': ['shell.hbs', 'main.css', 'shell.css'],
 * 		},
 * 	});
 * ]
 *
 * @class SwBuildWebpackPlugin
 */
class SwBuildWebpackPlugin {
	/**
	 * Creates an instance of SwBuildWebpackPlugin.
	 *
	 * @param {Object} [config] all the options as passed to `swbuild`
	 * @memberOf SwBuildWebpackPlugin
	 */
	constructor(config) {
		this._config = config;
	}
	/**
	 *
	 * @param {Object} [compiler] default compiler object passed from webpack
	 *
	 * @memberOf SwBuildWebpackPlugin
	 */
	apply(compiler) {
		compiler.plugin('after-emit', (compilation, callback) => {
			// If no root directory is given, fallback to
			// output path directory of webpack
			if (!this._config.rootDirectory) {
				this._config.rootDirectory = compilation.mainTemplate.getPublicPath({});
			}
			// If no dest is given, fallback to default service worker name in
			// output path directory
			if (!this._config.dest) {
				this._config.dest =
					path.join(this._config.rootDirectory, SERVICE_WORKER_NAME);
			}
			swBuild.generateSW(this._config)
				.then(() => callback())
				.catch((e) => callback(e));
		});
	}
}

module.exports = SwBuildWebpackPlugin;
