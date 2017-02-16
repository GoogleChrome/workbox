const getFileManifestEntries = require('./get-file-manifest-entries');
const writeFileManifest = require('./utils/write-file-manifest');
const errors = require('./errors');

/**
 * @example <caption>Generate a service worker for a project.</caption>
 * const swCLI = require('sw-cli');
 *
 * swCLI.generateFileManifest({
 *   dest: './build/manifest.js'
 *   rootDirectory: './build/',
 *   globPatterns: ['**\/*.{html,js,css}'],
 *   globIgnores: ['admin.html']
 * })
 * .then(() => {
 *   console.log('Build Manifest generated.');
 * });
 *
 * This method will generate a file manifest that can be used in a service
 * worker for caching assets offline..
 * @param {Object} input
 * @param {String} input.dest The name and path you wish to write your
 * manifest file to.
 * @param {String} input.rootDirectory The root of the files you wish to
 * be cached. This will also be the directory the service worker and library
 * files are written to.
 * @param {Array<String>} input.globPatterns Patterns to glob for when
 * generating the build manifest.
 * @param {String|Array<String>} input.globIgnores Patterns to exclude when
 * generating the build manifest.
 * @return {Promise} Resolves once the service worker has been generated
 * with a precache list.
 *
 * @memberof module:sw-cli
 */
const generateFileManifest = (input) => {
  if (!input || typeof input !== 'object' || input instanceof Array) {
    return Promise.reject(
      new Error(errors['invalid-generate-file-manifest-arg']));
  }

  const dest = input.dest;
  const rootDirectory = input.rootDirectory;
  const globPatterns = input.globPatterns;
  const globIgnores = input.globIgnores;

  const fileEntries = getFileManifestEntries({
    rootDirectory, globPatterns, globIgnores,
  });
  return writeFileManifest(dest, fileEntries);
};

module.exports = generateFileManifest;
