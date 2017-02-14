// This will be the logic that powers both module and CLI
const generateSW = require('./lib/generate-sw');

/**
 * # sw-cli
 *
 * Use as a command line tool or as a normal node-module.
 *
 * When first starting out you may find the CLI a friendly way to see
 * what sw-cli can do.
 *
 * To generate a service worker that will make your site work offline,
 * run the following in your terminal:
 *
 *     sw-cli generate-sw
 *
 * For some web apps this command will be all you need, though you may
 * want to generate the service worker as part of your build process.
 * you can do by calling the `generateSW()` method after all your assets
 * have been built.
 *
 * @example <caption>Generate a service worker for a project.</caption>
 * const swCLI = require('sw-cli');
 *
 * swCLI.generateSW({
 *   rootDirectory: './build/',
 *   globPatterns: ['**\/*.{html,js,css}'],
 *   globIgnores: ['admin.html']
 *   serviceWorkerName: 'sw.js'
 * })
 * .then(() => {
 *   console.log('Service worker generated.');
 * });
 *
 * @module sw-cli
 */

module.exports = {
  generateSW,
};
