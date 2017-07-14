'use strict';

const getFileManifestEntries = require('./get-file-manifest-entries');
const writeFileManifest = require('./utils/write-file-manifest');
const errors = require('./errors');

/**
 * This method will generate a file manifest that can be used in a service
 * worker to precache assets.
 *
 * @param {Object} input
 * @param {String} [input.format] There are some options for how the file
 * manifest is formatted in the final output. The format can be one of the
 * following values:
 * - **'iife'** - Output the manifest as an
 * [immediately invoked function](https://en.wikipedia.org/wiki/Immediately-invoked_function_expression).
 * - **'es'** - Output as an ES2015 module.
 *
 * Default value is 'iife'.
 * @param {String} input.manifestDest The file path and name where the file
 * manifest should be written (i.e. `./build/precache-manifest.js`).
 * @param {String} input.globDirectory The directory you wish to run the
 * `globPatterns` against.
 * @param {Array<String>} input.globPatterns Files matching against any of
 * these glob patterns will be included in the file manifest.
 * @param {String|Array<String>} [input.globIgnores] Files matching against any
 * of these glob patterns will be excluded from the file manifest, even if the
 * file matches against a `globPatterns` pattern.
 * @param {Object<String,Array|String>} [input.templatedUrls]
 * If a URL is rendered with templates on the server, its contents may
 * depend on multiple files. This maps URLs to an array of file names, or to a
 * string value, that uniquely determines the URL's contents.
 * @param {String} [input.modifyUrlPrefix] An object of key value pairs
 * where URL's starting with the key value will be replaced with the
 * corresponding value.
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
 * @return {Promise} The returned promise resolves once the manifest file has
 * been generated.
 *
 * @example <caption>Generate a build manifest of static assets, which can
 * used with a service worker.</caption>
 * const swBuild = require('workbox-build');
 *
 * swBuild.generateFileManifest({
 *   manifestDest: './build/manifest.js'
 *   globDirectory: './build/',
 *   globPatterns: ['**\/*.{html,js,css}'],
 *   globIgnores: ['admin.html'],
 *   format: 'iife', // alternatively, use 'es'
 * })
 * .then(() => {
 *   console.log('Build Manifest generated.');
 * });
 *
 * @memberof module:workbox-build
 */
const generateFileManifest = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return Promise.reject(
      new Error(errors['invalid-generate-file-manifest-arg']));
  }

  return getFileManifestEntries(input)
  .then((fileEntries) => {
    return writeFileManifest(input.manifestDest, fileEntries, input.format);
  });
};

module.exports = generateFileManifest;
