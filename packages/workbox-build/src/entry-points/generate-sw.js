const path = require('path');

const GenerateSWOptions = require('./options/generate-sw-options');
const copyWorkboxSW = require('../lib/copy-workbox-sw');
const getFileManifestEntries = require('../lib/get-file-manifest-entries');
const writeServiceWorkerUsingDefaultTemplate =
  require('../lib/write-sw-using-default-template');

/**
 * @memberof module:workbox-build
 */
async function generateSW(input) {
  const options = new GenerateSWOptions(input);

  const destDirectory = path.dirname(options.swDest);
  const pathToWorkboxSWFile = await copyWorkboxSW(destDirectory);

  // If we're writing our SW file to build/sw.js, the workbox-sw file will be
  // build/workbox-sw.js. So the sw.js file should import workboxSW.***.js
  // (i.e. not include build/).
  const pathToWorkboxSWFileRelativeToDest = path.relative(destDirectory,
    pathToWorkboxSWFile);

  // Add a few extra ignore rules to whatever might be specified to avoid
  // picking up the generated service worker or the workbox-sw files.
  options.globIgnores = [
    path.basename(pathToWorkboxSWFileRelativeToDest),
    `${path.basename(pathToWorkboxSWFileRelativeToDest)}.map`,
  ].map((file) => `**/${file}`).concat(options.globIgnores);
  const manifestEntries = await getFileManifestEntries(options);

  return writeServiceWorkerUsingDefaultTemplate({
    manifestEntries,
    importScripts: [pathToWorkboxSWFileRelativeToDest],
    ...options,
  });
}

module.exports = generateSW;
