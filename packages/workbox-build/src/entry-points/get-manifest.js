/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const checkForDeprecatedOptions =
    require('../lib/check-for-deprecated-options');
const getFileManifestEntries = require('../lib/get-file-manifest-entries');
const getManifestSchema = require('./options/get-manifest-schema');
const validate = require('./options/validate');

/**
 * This method returns a list of URLs to precache, referred to as a "precache
 * manifest", along with details about the number of entries and their size,
 * based on the options you provide.
 *
 * @param {Object} config Please refer to the
 * [configuration guide](https://developers.google.com/web/tools/workbox/modules/workbox-build#getmanifest_mode).
 * @return {Promise<{manifestEntries: Array<ManifestEntry>,
 * count: number, size: number, warnings: Array<string>}>} A promise that
 * resolves once the precache manifest is determined. The `size` property
 * contains the aggregate size of all the precached entries, in bytes, the
 * `count` property contains the total number of precached entries, and the
 * `manifestEntries` property contains all the `ManifestEntry` items. Any
 * non-fatal warning messages will be returned via `warnings`.
 *
 * @memberof module:workbox-build
 */
async function getManifest(config) {
  // This check needs to be done before validation, since the deprecated options
  // will be renamed.
  const deprecationWarnings = checkForDeprecatedOptions(config);

  const options = validate(config, getManifestSchema);

  const {manifestEntries, count, size, warnings} =
    await getFileManifestEntries(options);

  // Add in any deprecation warnings.
  warnings.push(...deprecationWarnings);

  return {manifestEntries, count, size, warnings};
}

module.exports = getManifest;
