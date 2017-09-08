'use strict';

const errors = require('./errors');
const getFileManifestEntries = require('./get-file-manifest-entries');
const warnAboutConfig = require('./utils/warn-about-config');
const writeFileManifest = require('./utils/write-file-manifest');

// A list of config options that are valid in some contexts, but not when
// using generateFileManifest().
const INVALID_CONFIG_OPTIONS = ['swSrc'];

/**
 * This method will generate a file manifest that can be used in a service
 * worker to precache assets.
 *
 * @param {module:workbox-build.Configuration} input
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
 * @return {Promise} Resolves once the manifest file has been created.
 *
 * @example <caption>Generate a build manifest of static assets, which can
 * used with a service worker.</caption>
 * const workboxBuild = require('workbox-build');
 *
 * workboxBuild.generateFileManifest({
 *   manifestDest: './build/manifest.js'
 *   globDirectory: './build/',
 *   globPatterns: ['**\/*.{html,js,css}'],
 *   globIgnores: ['admin.html'],
 *   format: 'iife', // alternatively, use 'es'
 * })
 * .then(() => {
 *   console.log('Build manifest generated.');
 * });
 *
 * @memberof module:workbox-build
 */
const generateFileManifest = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return Promise.reject(
      new Error(errors['invalid-generate-file-manifest-arg']));
  }

  warnAboutConfig(INVALID_CONFIG_OPTIONS, input, 'generateFileManifest');

  return getFileManifestEntries(input)
  .then((fileEntries) => {
    return writeFileManifest(input.manifestDest, fileEntries, input.format);
  });
};

module.exports = generateFileManifest;
