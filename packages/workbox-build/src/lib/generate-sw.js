'use strict';

const path = require('path');
const copyWorkboxSW = require('./utils/copy-workbox-sw');
const getFileManifestEntries = require('./get-file-manifest-entries');
const writeServiceWorker = require('./write-sw');
const errors = require('./errors');
const constants = require('./constants');

/**
 * This method will generate a working service worker with an inlined
 * file manifest.
 *
 * @param {Object} input
 * @param {String} input.swDest The file path and name you wish to write the
 * service worker file to.
 * @param {String} input.globDirectory The directory you wish to run the
 * `globPatterns` against.
 * @param {Array<String>} input.globPatterns Files matching against any of
 * these glob patterns will be included in the file manifest.
 *
 * Defaults to ['**\/*.{js,css}']
 * @param {String|Array<String>} [input.globIgnores] Files matching against any
 * of these glob patterns will be excluded from the file manifest, even if the
 * file matches against a `globPatterns` pattern. Defaults to ignoring
 * 'node_modules'.
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
 * @return {Promise} Resolves once the service worker has been generated
 * with a precache list.
 *
 * @example <caption>Generate a service worker with precaching support.
 * </caption>
 * const swBuild = require('workbox-build');
 *
 * swBuild.generateSW({
 *   swDest: './build/sw.js',
 *   globDirectory: './build/',
 *   globPatterns: ['**\/*.{html,js,css}'],
 *   globIgnores: ['admin.html'],
 *   templatedUrls: {
 *     '/shell': ['shell.hbs', 'main.css', 'shell.css'],
 *   },
 * })
 * .then(() => {
 *   console.log('Service worker generated.');
 * });
 *
 * @memberof module:workbox-build
 */
const generateSW = function(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return Promise.reject(new Error(errors['invalid-generate-sw-input']));
  }

  // Type check input so that defaults can be used if appropriate.
  if (typeof input.globIgnores === 'string') {
    input.globIgnores = [input.globIgnores];
  }
  if (input.globIgnores && !(Array.isArray(input.globIgnores))) {
    return Promise.reject(
      new Error(errors['invalid-glob-ignores']));
  }

  if (typeof input.globDirectory !== 'string' ||
    input.globDirectory.length === 0) {
    return Promise.reject(
      new Error(errors['invalid-glob-directory']));
  }

  if (typeof input.swDest !== 'string' || input.swDest.length === 0) {
    return Promise.reject(
      new Error(errors['invalid-sw-dest']));
  }

  if (input.runtimeCaching && !(Array.isArray(input.runtimeCaching))) {
    return Promise.reject(
      new Error(errors['invalid-runtime-caching']));
  }

  const globDirectory = input.globDirectory;
  input.globIgnores = input.globIgnores || constants.defaultGlobIgnores;
  const swDest = input.swDest;

  let workboxSWImportPath;
  let destDirectory = path.dirname(swDest);
  return copyWorkboxSW(destDirectory)
  .then((libPath) => {
    // If sw file is in build/sw.js, the workboxSW file will be
    // build/workboxSW.***.js. So the sw.js file should import workboxSW.***.js
    // (i.e. not include build/).
    workboxSWImportPath = path.relative(destDirectory, libPath);

    // we will be globbing in the globDirectory, so we need to ignore relative
    // to that path.
    input.globIgnores.push(path.relative(globDirectory, libPath));
    input.globIgnores.push(path.relative(globDirectory, swDest));
  })
  .then(() => {
    return getFileManifestEntries(input);
  })
  .then((manifestEntries) => {
    return writeServiceWorker(
      swDest,
      manifestEntries,
      workboxSWImportPath,
      globDirectory,
      input
    );
  });
};

module.exports = generateSW;
