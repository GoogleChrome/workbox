const GenerateSWNoFSOptions = require('./options/generate-sw-no-fs-options');
const getFileManifestEntries = require('../lib/get-file-manifest-entries');
const populateSWTemplate = require('../lib/populate-sw-template');

/**
 * This method generates a service worker based on the configuration options
 * provided without reading or writing to the disk.
 *
 * Both the source template (in a format parsable by
 * [`lodash.template`](https://lodash.com/docs/4.17.4#template)) and the
 * populated template are strings.
 *
 * The ideal use case for this method is when you have a larger build system
 * that has its own way of interacting with the filesystem (such as a Webpack).
 *
 * @param {Object} input
 * @return {Promise<String>} A populated service worker template, based on the
 * other configuration options provided.
 *
 * @memberof module:workbox-build
 */
async function generateSWNoFS(input) {
  const options = new GenerateSWNoFSOptions(input);

  const {manifestEntries} = await getFileManifestEntries(options);

  return populateSWTemplate({
    manifestEntries,
    ...options,
  });
}

module.exports = generateSWNoFS;
