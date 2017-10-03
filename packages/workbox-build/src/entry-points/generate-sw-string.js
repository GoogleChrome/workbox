const GenerateSWStringOptions = require('./options/generate-sw-no-fs-options');
const getFileManifestEntries = require('../lib/get-file-manifest-entries');
const populateSWTemplate = require('../lib/populate-sw-template');

/**
 * This method generates a service worker based on the configuration options
 * provided.
 *
 * @param {Object} input
 * @return {Promise<String>} A populated service worker template, based on the
 * other configuration options provided.
 *
 * @memberof module:workbox-build
 */
async function generateSWString(input) {
  const options = new GenerateSWStringOptions(input);

  const {manifestEntries} = await getFileManifestEntries(options);

  return populateSWTemplate(Object.assign({
    manifestEntries,
  }, options));
}

module.exports = generateSWString;
