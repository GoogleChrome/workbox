const path = require('path');

const GenerateSWOptions = require('./options/generate-sw-options');
const copyWorkboxSW = require('../lib/copy-workbox-sw');
const getFileManifestEntries = require('../lib/get-file-manifest-entries');
const writeServiceWorkerUsingDefaultTemplate =
  require('../lib/write-sw-using-default-template');

/**
 * This method creates a list of URLs to precache, referred to as a "precache
 * manifest", based on the options you provide.
 *
 * It also takes in additional options that configures the service worker's
 * behavior, like any `runtimeCaching` rules it should use.
 *
 * Based on the precache manifest and the additional configuration, it writes
 * a ready-to-use service worker file to disk at `swDest`.
 *
 * @param {Object} input
 * @return {Promise<{count: Number, size: Number}>} A promise that resolves once
 * the service worker file has been written to `swDest`. The `size` property
 * contains the aggregate size of all the precached entries, in bytes, and the
 * `count` property contains the total number of precached entries.
 *
 * @memberof module:workbox-build
 */
async function generateSW(input) {
  const options = new GenerateSWOptions(input);

  const destDirectory = path.dirname(options.swDest);

  if (options.importWorkboxFromCDN) {
    const buildType = (process.env.NODE_ENV &&
                       process.env.NODE_ENV.startsWith('dev')) ? 'dev' : 'prod';
    // TODO: Change to official CDN URL.
    const CDN_URL = `https://unpkg.com/workbox-sw@2.0.3/build/importScripts/` +
      `workbox-sw.${buildType}.v2.0.3.js`;
    // importScripts may or may not already be an array containing other URLs.
    options.importScripts = (options.importScripts || []).concat(CDN_URL);
  } else {
    // If we're not importing the Workbox script from
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

    // importScripts may or may not already be an array containing other URLs.
    options.importScripts = (options.importScripts || []).concat(
      pathToWorkboxSWFileRelativeToDest);
  }

  const {count, size, manifestEntries} = await getFileManifestEntries(options);

  await writeServiceWorkerUsingDefaultTemplate({
    manifestEntries,
    ...options,
  });

  return {count, size};
}

module.exports = generateSW;
