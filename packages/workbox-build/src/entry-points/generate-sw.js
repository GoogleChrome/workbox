/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const path = require('path');

const cdnUtils = require('../lib/cdn-utils');
const checkForDeprecatedOptions =
    require('../lib/check-for-deprecated-options');
const copyWorkboxLibraries = require('../lib/copy-workbox-libraries');
const generateSWSchema = require('./options/generate-sw-schema');
const getFileManifestEntries = require('../lib/get-file-manifest-entries');
const validate = require('./options/validate');
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
 * @param {Object} config Please refer to the
 * [configuration guide](https://developers.google.com/web/tools/workbox/modules/workbox-build#full_generatesw_config).
 * @return {Promise<{count: number, size: number, warnings: Array<string>}>}
 * A promise that resolves once the service worker file has been written to
 * `swDest`. The `size` property contains the aggregate size of all the
 * precached entries, in bytes, and the `count` property contains the total
 * number of precached entries. Any non-fatal warning messages will be returned
 * via `warnings`.
 *
 * @memberof module:workbox-build
 */
async function generateSW(config) {
  // This check needs to be done before validation, since the deprecated options
  // will be renamed.
  const deprecationWarnings = checkForDeprecatedOptions(config);

  const options = validate(config, generateSWSchema);

  const destDirectory = path.dirname(options.swDest);

  // Do nothing if importWorkboxFrom is set to 'disabled'. Otherwise, check:
  if (options.importWorkboxFrom === 'cdn') {
    const cdnURL = cdnUtils.getModuleURL('workbox-sw');
    options.workboxSWImport = cdnURL;
  } else if (options.importWorkboxFrom === 'local') {
    // Copy over the dev + prod version of all of the core libraries.
    const workboxDirectoryName = await copyWorkboxLibraries(destDirectory);

    // The Workbox library files should not be precached, since they're cached
    // automatically by virtue of being used with importScripts().
    options.globIgnores = [
      `**/${workboxDirectoryName}/*.+(js|mjs)*`,
    ].concat(options.globIgnores || []);

    const workboxSWPkg = require(`workbox-sw/package.json`);
    const workboxSWFilename = path.basename(workboxSWPkg.main);

    options.workboxSWImport = `${workboxDirectoryName}/${workboxSWFilename}`;
    options.modulePathPrefix = workboxDirectoryName;
  }

  const {count, size, manifestEntries, warnings} =
    await getFileManifestEntries(options);

  await writeServiceWorkerUsingDefaultTemplate(Object.assign({
    manifestEntries,
  }, options));

  // Add in any deprecation warnings.
  warnings.push(...deprecationWarnings);

  return {count, size, warnings};
}

module.exports = generateSW;
