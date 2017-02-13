const path = require('path');

const getFileDetails = require('./utils/get-file-details');
const filterFiles = require('./utils/filter-files');
const copySWLib = require('./utils/copy-sw-lib');
const generateGlobPattern = require('./utils/generate-glob-pattern');
const writeServiceWorker = require('./write-sw');
const errors = require('./errors');

/**
 * @example <caption>Generate a service worker for a project.</caption>
 * const swCLI = require('sw-cli');
 *
 * swCLI.generateSW({
 *   rootDirectory: './build/',
 *   fileExtentionsToCache: ['html', 'js', 'css'],
 *   serviceWorkerName: 'sw.js',
 *   excludeFiles: [],
 * })
 * .then(() => {
 *   console.log('Service worker generated.');
 * });
 *
 * This method will generate a working Service Worker with an inlined
 * file manifest.
 * @param {Object} input
 * @param {String} input.rootDirectory The root of the files you wish to
 * be cached. This will also be the directory the service worker and library
 * files are written to.
 * @param {Array<String>} input.fileExtentionsToCache Files with extension
 * types defined in this array will be globbed and added to your precache list.
 * @param {String} input.swName The name you wish to give to your service
 * worker file.
 * @param {Array<String>} input.excludeFiles Files that should be excluded
 * from precaching can be listed here.
 * @return {Promise} Resolves once the service worker has been generated
 * with a precache list.
 *
 * @memberof module:sw-cli
 */
const generateSW = function(args) {
  if (!args || typeof args !== 'object' || args instanceof Array) {
    return Promise.reject(new Error(errors['invalid-generate-sw-input']));
  }

  const rootDirectory = args.rootDirectory;
  const fileExtentionsToCache = args.fileExtentionsToCache;
  const excludeFiles = args.excludeFiles;
  const swName = args.serviceWorkerName;

  if (typeof rootDirectory !== 'string' || rootDirectory.length === 0) {
    return Promise.reject(
      new Error(errors['invalid-generate-sw-root-directory']));
  }

  let swlibPath;
  return copySWLib(rootDirectory)
  .then((libPath) => {
    swlibPath = libPath;
    excludeFiles.push(path.basename(swlibPath));
  })
  .then(() => {
    const globs = [
      generateGlobPattern(rootDirectory, fileExtentionsToCache),
    ];
    const manifestEntries = _getFileManifestEntries(
      globs, rootDirectory, excludeFiles);

    return writeServiceWorker(
      path.join(rootDirectory, swName),
      manifestEntries,
      swlibPath,
      rootDirectory
    );
  });
};

const _getFileManifestEntries = function(globs, rootDirectory, excludeFiles) {
  const fileDetails = globs.reduce((accumulated, globPattern) => {
    const globbedFileDetails = getFileDetails(rootDirectory, globPattern);
    return accumulated.concat(globbedFileDetails);
  }, []);

  return filterFiles(fileDetails, excludeFiles);
};

module.exports = generateSW;
