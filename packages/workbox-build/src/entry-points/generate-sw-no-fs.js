const GenerateSWNoFSOptions = require('./options/generate-sw-no-fs-options');
const getFileManifestEntries = require('../lib/get-file-manifest-entries');
const populateSWTemplate = require('../lib/populate-sw-template');

/**
 * @memberof module:workbox-build
 */
async function generateSWNoFS(input) {
  const options = new GenerateSWNoFSOptions(input);

  const manifestEntries = await getFileManifestEntries(options);

  return populateSWTemplate({
    manifestEntries,
    ...options,
  });
}

module.exports = generateSWNoFS;
