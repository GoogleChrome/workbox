const GenerateFileManifestPlugin = require('./lib/generate-file-manifest');
const GenerateSWPlugin = require('./lib/generate-sw');
const InjectManifestPlugin = require('./lib/inject-manifest');

/**
 * Use one of the plugins to integrate a webpack project with
 * [workbox-build]{@link module:workbox-build}.
 *
 * @example
 * const { GenerateSWPlugin } = require('workbox-webpack-plugin');
 * .
 * .
 * module.exports = {
 *   entry: {
 *     app: './step1/app.js'
 *   },
 *   output: {
 *     path: __dirname + '/step1/public/js',
 *     publicPath: '/public/js/',
 *     filename: '[name].js',
 *   },
 *   plugins: [
 *     new GenerateSWPlugin({
 *       globPatterns: ['**\/*.{html,js,css}'],
 *       globIgnores: ['admin.html'],
 *       swDest: './build/sw.js',
 *     });
 *   ]
 * }
 *
 * @module workbox-webpack-plugin
 */

module.exports = {
  GenerateSWPlugin,
  GenerateFileManifestPlugin,
  InjectManifestPlugin,
};
