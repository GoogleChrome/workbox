'use strict';
// This will be the logic that powers both module and CLI
const generateSW = require('./lib/generate-sw');
const getFileManifestEntries = require('./lib/get-file-manifest-entries');
const generateFileManifest = require('./lib/generate-file-manifest');
const injectManifest = require('./lib/inject-manifest');

/**
 * # workbox-build
 *
 * This Node module can be used to generate a list of assets that should be
 * precached in a service worker, generating a hash that can be used to
 * intelligently update a cache when the service worker is updated.
 *
 * This module will use glob patterns to find assets in a given directory
 * and use the resulting URL and hash data for one of the follow uses:
 *
 * 1. Generate a complete service worker with precaching and some basic
 * configurable options. See
 * [generateSW()]{@link module:workbox-build.generateSW}.
 * 1. Inject a manifest into an existing service worker. This allows you
 * to control your own service worker while still taking advantage of
 * [workboxSW.precache()]{@link module:workbox-sw.WorkboxSW#precache} logic.
 * See [injectManifest()]{@link module:workbox-build.injectManifest}.
 * 1. Generate a manifest file. This is useful if you want to read in the
 * urls and revision details via an import script or ES2015 module import.
 * See [generateFileManifest()]{@link
 *  module:workbox-build.generateFileManifest}.
 * 1. Get a JS object of the manifest details. Can be used in a build process
 * if you want to inject the manifest into a file or template yourself.
 * See [getFileManifestEntries()]{@link
 *  module:workbox-build.getFileManifestEntries}.
 *
 * @example <caption>Generate a complete service worker that will precache
 * the discovered assets.</caption>
 * const swBuild = require('workbox-build');
 *
 * swBuild.generateSW({
 *   globDirectory: './build/',
 *   globPatterns: ['**\/*.{html,js,css}'],
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
 * @example <caption>Generate a file containing the assets to precache.
 * </caption>
 * const swBuild = require('workbox-build');
 *
 * swBuild.generateFileManifest({
 *   globDirectory: './build/',
 *   globPatterns: ['**\/*.{html,js,css}'],
 *   globIgnores: ['service-worker.js','admin.html'],
 *   manifestDest: './build/scripts/manifest.js',
 *   templatedUrls: {
 *     '/shell': ['shell.hbs', 'main.css', 'shell.css'],
 *   },
 * })
 * .then(() => {
 *   console.log('Build file has been created.');
 * });
 *
 * @example <caption>Get an Array of files with revision details.</caption>
 * const swBuild = require('workbox-build');
 *
 * swBuild.getFileManifestEntries({
 *   globDirectory: './build/',
 *   globPatterns: ['**\/*.{html,js,css}'],
 *   globIgnores: ['service-worker.js','admin.html'],
 *   templatedUrls: {
 *     '/shell': ['shell.hbs', 'main.css', 'shell.css'],
 *   },
 * })
 * .then((fileDetails) => {
 *   // An array of file details include a `url` and `revision` parameter.
 * });
 *
 * @module workbox-build
 */

/**
 * These are the full set of options that could potentially be used to configure
 * one of the build tools. Each of the build tools has a slightly different way
 * of providing these options:
 *
 * - When using the `workbox-build` `node` module directly, pass them in to the
 * appropriate method. For example, `workboxBuild.injectManifest(configuration)`
 * or `workboxBuild.injectManifest(configuration)`.
 *
 * - When using the `workbox-cli` command line interface, use the
 * `--config-file` flag to point to a
 * [CommonJS module file](https://nodejs.org/docs/latest/api/modules.html) that
 * assigns the configuration to `module.exports`.
 *
 * `workbox-webpack-plugin` (a [Webpack](https://webpack.js.org/) interface.)
 *
 * Some specific options might not make sense with certain combinations of
 * interfaces, and in those cases, the limitations are called out in the
 * documentation, and may lead to build-time errors.
 *
 * Each option documented here includes an example, which, for the sake of
 * illustration, assumes the following local filesystem setup. Please adjust
 * the example values to match your actual setup.
 *
 * ```sh
 * ./
 * ├── dev/
 * │   ├── app.js
 * │   ├── index.html
 * │   └── main.css
 * └── dist/
 *     ├── app.js
 *     ├── index.html
 *     ├── main.css
 *     └── sw.js
 * ```
 *
 * @param {Object} input
 *
 * @param {String} input.swDest The path to the final service worker file that
 * will be created by the build process.
 *
 * E.g.: `'./dist/sw.js'`
 *
 * @param {String} input.globDirectory The base directory you wish to match
 * `globPatterns` against.
 *
 * E.g.: `'./dev'`
 *
 * @param {Array<String>} [input.globPatterns='**\/*.{js,css}']
 * Files matching against any of these
 * [glob patterns](https://github.com/isaacs/node-glob) will be included in the
 * precache manifest.
 *
 * E.g.: `'**\/*.{js,css,html}'`
 *
 * @param {String|Array<String>} [input.globIgnores='node_modules'] Files matching against any
 * of these glob patterns will be excluded from the file manifest, even if the
 * file matches against a `globPatterns` pattern.
 * @param {Object<String,Array|String>} [input.templatedUrls]
 * If a URL is rendered with templates on the server, its contents may
 * depend on multiple files. This maps URLs to an array of file names, or to a
 * string value, that uniquely determines the URL's contents.
 * @param {string} [input.navigateFallback] This URL will be used as a fallback
 * if a navigation request can't be fulfilled. Normally this URL would be
 * precached so it's always available. This is particularly useful for single
 * page apps where requests should go to a single URL.
 * @param {Array<Regexp>} [input.navigateFallbackWhitelist] An optional Array
 * of regexs to restrict which URL's use the `navigateFallback` URL.
 * @param {String} [input.cacheId] An optional ID to be prepended to caches
 * used by workbox-build. This is primarily useful for local development where
 * multiple sites may be served from the same `http://localhost` origin.
 * @param {Boolean} [input.skipWaiting] When set to true the generated service
 * worker activate immediately.
 *
 * Defaults to false.
 * @param {Boolean} [input.clientsClaim] When set to true the generated service
 * worker will claim any currently open pages.
 *
 * Defaults to false.
 * @param {string} [input.directoryIndex] If a request for a URL ending in '/'
 * fails, this value will be appended to the URL and a second request will be
 * made.
 *
 * Defaults to 'index.html'.
 * @param {Array<Object>} [input.runtimeCaching] Passing in an array of objects
 * containing a `urlPattern` and a `handler` parameter will add the appropriate
 * code to the service work to handle run time caching for URL's matching the
 * pattern with the associated handler behavior.
 * @param {String} [input.modifyUrlPrefix] An object of key value pairs
 * where URL's starting with the key value will be replaced with the
 * corresponding value.
 * @param {Array<RegExp>} [input.ignoreUrlParametersMatching] Any search
 * parameters matching against one of the regex's in this array will be removed
 * before looking for a cache match.
 * @param {Boolean} [input.handleFetch] When set to false all requests will
 * go to the network. This is useful during development if you don't want the
 * service worker from preventing updates.
 *
 * Defaults to true.
 * @param {number} [input.maximumFileSizeToCacheInBytes] This value can be used
 * to determine the maximum size of files that will be precached.
 *
 * Defaults to 2MB.
 * @param {RegExp} [input.dontCacheBustUrlsMatching] Assets that match this
 * regex will not have their revision details included in the precache. This
 * is useful for assets that have revisioning details in the filename.
 * @param {Array<ManifestTransform>} [input.manifestTransforms] A list of
 * manifest transformations, which will be applied sequentially against the
 * generated manifest. If `modifyUrlPrefix` or `dontCacheBustUrlsMatching` are
 * also specified, their corresponding transformations will be applied first.
 *
 * @typedef Configuration
 * @memberof module:workbox-build
 */


module.exports = {
  generateSW,
  generateFileManifest,
  getFileManifestEntries,
  injectManifest,
};
