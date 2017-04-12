const swBuild = require('../sw-build/src/');
const path = require('path');

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
		this._config = config || {};
	}
	getConfig(compilation) {
		let config = this._config;

		// If no root directory is given, fallback to
		// output path directory of webpack
		if (!config.rootDirectory) {
			config.rootDirectory = compilation.mainTemplate.getPublicPath({});
		}

		return config;
	}

	/**
	 *
	 * @param {Object} [compiler] default compiler object passed from webpack
	 *
	 * @memberOf SwBuildWebpackPlugin
	 */
	apply(compiler) {
		compiler.plugin('after-emit', (compilation, callback) => {
			const config = this.getConfig(compilation);

			if (config.swFile) {
				swBuild.injectManifest(config)
					.then(() => callback())
					.catch((e) => callback(e));
			} else {
				swBuild.generateSW(config)
				.then(() => callback())
				.catch((e) => callback(e));
			}
		});
	}
}

module.exports = SwBuildWebpackPlugin;
