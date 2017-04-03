const path = require('path');
const copySWLib = require('./utils/copy-sw-lib');
const getFileManifestEntries = require('./get-file-manifest-entries');
const writeServiceWorker = require('./write-sw');
const errors = require('./errors');

/**
 * @example <caption>Generate a service worker for a project.</caption>
 * const swBuild = require('sw-build');
 *
 * swBuild.generateSW({
 *   rootDirectory: './build/',
 *   dest: './build/sw.js',
 *   staticFileGlobs: ['**\/*.{html,js,css}'],
 *   globIgnores: ['admin.html'],
 *   templatedUrls: {
 *     '/shell': ['shell.hbs', 'main.css', 'shell.css'],
 *   },
 * })
 * .then(() => {
 *   console.log('Service worker generated.');
 * });
 *
 * This method will generate a working service worker with an inlined
 * file manifest.
 * @param {Object} input
 * @param {String} input.rootDirectory The root of the files you wish to
 * be cached. This will also be the directory the service worker and library
 * files are written to.
 * @param {Array<String>} input.staticFileGlobs Patterns to glob for when
 * generating the build manifest.
 * @param {String|Array<String>} [input.globIgnores] Patterns to exclude when
 * generating the build manifest.
 * @param {String} input.dest The name you wish to give to your
 * service worker file.
 * @param {Object<String,Array|String>} [input.templatedUrls]
 * If a URL is rendered/templated on the server, its contents may not depend on
 * a single file. This maps URLs to a list of file names, or to a string
 * value, that uniquely determines each URL's contents.
 * @return {Promise} Resolves once the service worker has been generated
 * with a precache list.
 *
 * @memberof module:sw-build
 */
const generateSW = function(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return Promise.reject(new Error(errors['invalid-generate-sw-input']));
  }

  // Type check input so that defaults can be used if appropriate.
  if (input.globIgnores && !(Array.isArray(input.globIgnores))) {
    return Promise.reject(
      new Error(errors['invalid-glob-ignores']));
  }

  if (typeof input.rootDirectory !== 'string' ||
    input.rootDirectory.length === 0) {
    return Promise.reject(
      new Error(errors['invalid-root-directory']));
  }

  if (typeof input.dest !== 'string' || input.dest.length === 0) {
    return Promise.reject(
      new Error(errors['invalid-dest']));
  }

  const rootDirectory = input.rootDirectory;
  const staticFileGlobs = input.staticFileGlobs;
  const globIgnores = input.globIgnores ? input.globIgnores : [];
  const dest = input.dest;
  const templatedUrls = input.templatedUrls;

  let swlibPath;
  return copySWLib(rootDirectory)
  .then((libPath) => {
    swlibPath = libPath;
    globIgnores.push(path.relative(rootDirectory, swlibPath));
  })
  .then(() => {
    return getFileManifestEntries(
      {staticFileGlobs, globIgnores, rootDirectory, templatedUrls});
  })
  .then((manifestEntries) => {
    return writeServiceWorker(
      dest,
      manifestEntries,
      swlibPath,
      rootDirectory
    );
  });
};

module.exports = generateSW;
