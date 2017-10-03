const GetManifestOptions = require('./options/get-manifest-options');
const getFileManifestEntries = require('../lib/get-file-manifest-entries');

/**
 * This method returns a list of URLs to precache, referred to as a "precache
 * manifest", along with details about the number of entries and their size,
 * based on the options you provide.
 *
 * @param {Object} input
 * @return {Promise<{manifestEntries: Array<ManifestEntry>,
 * count: Number, size: Number}>} A promise that resolves once the precache
 * manifest is determined. The `size` property contains the aggregate size of
 * all the precached entries, in bytes, the `count` property contains the total
 * number of precached entries, and the `manifestEntries` property contains all
 * the `ManifestEntry` items.
 *
 * @memberof module:workbox-build
 */
async function getManifest(input) {
  const options = new GetManifestOptions(input);

  const {manifestEntries, count, size} = await getFileManifestEntries(options);
  return {manifestEntries, count, size};
}

module.exports = getManifest;
