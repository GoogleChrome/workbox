// This will be the logic that powers both module and CLI
const generateSW = require('./lib/generate-sw');
const getFileManifestEntries = require('./lib/get-file-manifest-entries');
const generateFileManifest = require('./lib/generate-file-manifest');
const injectManifest = require('./lib/inject-manifest');

/**
 * # workbox-build
 *
 * To get a list of url's and a corresponding revision details, call either
 * `generateFileManifest` or `getFileManifestEntries()`.
 *
 * `generateFileManifest()` will run globs over a directory of static assets
 * and write a JavaScript file containing URL's and revision details for those
 * files.
 *
 * If you'd rather receive the data as a JavaScript Array, use
 * `getFileManifestEntries()` instead.
 *
 * If you only need precaching of your static assets in your service
 * worker and nothing else, you can generate complete service worker
 * with `generateSW()`.
 *
 * @example <caption>Generate a build manifest file.</caption>
 * const swBuild = require('workbox-build');
 *
 * swBuild.generateFileManifest({
 *   globDirectory: './build/',
 *   staticFileGlobs: ['**\/*.{html,js,css}'],
 *   globIgnores: ['service-worker.js','admin.html'],
 *   mainfestDest: './build/scripts/manifest.js',
 *   templatedUrls: {
 *     '/shell': ['shell.hbs', 'main.css', 'shell.css'],
 *   },
 * })
 * .then(() => {
 *   console.log('Build file has been created.');
 * });
 *
 * @example <caption>Get a list of files with revision details.</caption>
 * const swBuild = require('workbox-build');
 *
 * swBuild.getFileManifestEntries({
 *   globDirectory: './build/',
 *   staticFileGlobs: ['**\/*.{html,js,css}'],
 *   globIgnores: ['service-worker.js','admin.html'],
 *   templatedUrls: {
 *     '/shell': ['shell.hbs', 'main.css', 'shell.css'],
 *   },
 * })
 * .then((fileDetails) => {
 *   // An array of file details include a `url` and `revision` parameter.
 * });
 *
 * @example <caption>Generate a service worker for a project.</caption>
 * const swBuild = require('workbox-build');
 *
 * swBuild.generateSW({
 *   globDirectory: './build/',
 *   staticFileGlobs: ['**\/*.{html,js,css}'],
 *   globIgnores: ['service-worker.js','admin.html'],
 *   swDest: './build/sw.js',
 *   templatedUrls: {
 *     '/shell': ['shell.hbs', 'main.css', 'shell.css'],
 *   },
 * })
 * .then(() => {
 *   console.log('Service worker generated.');
 * });
 *
 * @module workbox-build
 */

module.exports = {
  generateSW,
  generateFileManifest,
  getFileManifestEntries,
  injectManifest,
};
