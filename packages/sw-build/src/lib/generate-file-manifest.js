const getFileManifestEntries = require('./get-file-manifest-entries');
const writeFileManifest = require('./utils/write-file-manifest');
const errors = require('./errors');

/**
 * @example <caption>Generate a build manifest of static assets, which could
 * then be used with a service worker.</caption>
 * const swBuild = require('sw-build');
 *
 * swBuild.generateFileManifest({
 *   dest: './build/manifest.js'
 *   rootDirectory: './build/',
 *   staticFileGlobs: ['**\/*.{html,js,css}'],
 *   globIgnores: ['admin.html'],
 *   format: 'iife', // alternatively, use 'es'
 * })
 * .then(() => {
 *   console.log('Build Manifest generated.');
 * });
 *
 * This method will generate a file manifest that can be used in a service
 * worker for caching assets offline.
 * @param {Object} input
 * @param {String} input.dest The name and path you wish to write your
 * manifest file to.
 * @param {String} input.rootDirectory The root of the files you wish to
 * be cached. This will also be the directory the service worker and library
 * files are written to.
 * @param {Array<String>} input.staticFileGlobs Patterns to glob for when
 * generating the build manifest.
 * @param {String|Array<String>} [input.globIgnores] Patterns to exclude when
 * generating the build manifest.
 * @param {Object<String,Array|String>} [input.templatedUrls]
 * If a URL is rendered/templated on the server, its contents may not depend on
 * a single file. This maps URLs to a list of file names, or to a string
 * value, that uniquely determines each URL's contents.
 * @param {String} [input.format] Default format is [`'iife'`](https://en.wikipedia.org/wiki/Immediately-invoked_function_expression), but also
 * accepts `'es'`, which outputs an ES2015 module.
 * @return {Promise} Resolves once the service worker has been generated
 * with a precache list.
 *
 * @memberof module:sw-build
 */
const generateFileManifest = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return Promise.reject(
      new Error(errors['invalid-generate-file-manifest-arg']));
  }

  return getFileManifestEntries(input)
  .then((fileEntries) => {
    return writeFileManifest(input.dest, fileEntries, input.format);
  });
};

module.exports = generateFileManifest;
