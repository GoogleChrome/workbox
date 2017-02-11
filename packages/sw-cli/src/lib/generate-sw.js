const path = require('path');

const getFileDetails = require('./utils/get-file-details');
const filterFiles = require('./utils/filter-files');
const copySWLib = require('./utils/copy-sw-lib');
const generateGlobPattern = require('./utils/generate-glob-pattern');
const writeServiceWorker = require('./write-sw');

/**
 * This method will generate a working Service Worker with an inlined
 * file manifest.
 * @return {Promise} The promise returned here will be used to exit the
 * node process cleanly or not.
 */
const generateSW = function({
  rootDirectory, relativePath, fileExtentionsToCache, serviceWorkerName,
  excludeFiles,
}) {
  let swlibPath;
  const globs = [
    generateGlobPattern(relativePath, fileExtentionsToCache),
  ];
  return copySWLib(rootDirectory)
  .then((libPath) => {
    swlibPath = libPath;
    excludeFiles.push(path.basename(swlibPath));
  })
  .then(() => {
    const manifestEntries = _getFileManifestEntries(
      globs, rootDirectory, excludeFiles);

    return writeServiceWorker(
      path.join(rootDirectory, serviceWorkerName),
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
