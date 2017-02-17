// This will be the logic that powers both module and CLI
const generateSW = require('./lib/generate-sw');
const getFileManifestEntries = require('./lib/get-file-manifest-entries');
const generateFileManifest = require('./lib/generate-file-manifest');

/**
 * # sw-build
 *
 * Use as a command line tool or as a normal node-module.
 *
 * When first starting out you may find the CLI a friendly way to see
 * what sw-build can do.
 *
 * To generate a service worker that will make your site work offline,
 * run the following in your terminal:
 *
 *     sw-build generate-sw
 *
 * For some web apps this command will be all you need, though you may
 * want to generate the service worker as part of your build process.
 * you can do by calling the `generateSW()` method after all your assets
 * have been built.
 *
 * @example <caption>Generate a service worker for a project.</caption>
 * const swCLI = require('sw-build');
 *
 * swCLI.generateSW({
 *   rootDirectory: './build/',
 *   globPatterns: ['**\/*.{html,js,css}'],
 *   globIgnores: ['admin.html'],
 *   serviceWorkerName: 'sw.js'
 * })
 * .then(() => {
 *   console.log('Service worker generated.');
 * });
 *
 * @example <caption>Generate a build manifest file.</caption>
 * const swCLI = require('sw-build');
 *
 * swCLI.generateFileManifest({
 *   dest: './build/scripts/manifest.js',
 *   rootDirectory: './build/',
 *   globPatterns: ['**\/*.{html,js,css}'],
 *   globIgnores: ['admin.html']
 * })
 * .then(() => {
 *   console.log('Build file has been created.');
 * });
 *
 * @example <caption>Get a list of files with revision details.</caption>
 * const swCLI = require('sw-build');
 *
 * swCLI.getFileManifestEntries({
 *   rootDirectory: './build/',
 *   globPatterns: ['**\/*.{html,js,css}'],
 *   globIgnores: ['admin.html']
 * })
 * .then((fileDetails) => {
 *   // An array of file details include a `url` and `revision` parameter.
 * });
 *
 * @module sw-build
 */

module.exports = {
  generateSW,
  generateFileManifest,
  getFileManifestEntries,
};
