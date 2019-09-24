/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const upath = require('upath');

const generateSWSchema = require('./options/schema/generate-sw');
const getFileManifestEntries = require('./lib/get-file-manifest-entries');
const rebasePath = require('./lib/rebase-path');
const validate = require('./lib/validate-options');
const writeServiceWorkerUsingDefaultTemplate =
  require('./lib/write-sw-using-default-template');

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
 * @return {Promise<{count: number, filePaths: Array<string>, size: number, warnings: Array<string>}>}
 * A promise that resolves once the service worker and related files
 * (indicated by `filePaths`) has been written to `swDest`. The `size` property
 * contains the aggregate size of all the precached entries, in bytes, and the
 * `count` property contains the total number of precached entries. Any
 * non-fatal warning messages will be returned via `warnings`.
 *
 * @memberof module:workbox-build
 */
async function generateSW(config) {
  const options = validate(config, generateSWSchema);

  if (options.globDirectory) {
    // Make sure we leave swDest out of the precache manifest.
    options.globIgnores.push(rebasePath({
      baseDirectory: options.globDirectory,
      file: options.swDest,
    }));

    // If we create an extra external runtime file, ignore that, too.
    // See https://rollupjs.org/guide/en/#outputchunkfilenames for naming.
    if (!options.inlineWorkboxRuntime) {
      const swDestDir = upath.dirname(options.swDest);
      const workboxRuntimeFile = upath.join(swDestDir, 'workbox-*.js');
      options.globIgnores.push(rebasePath({
        baseDirectory: options.globDirectory,
        file: workboxRuntimeFile,
      }));
    }
  }

  const {count, size, manifestEntries, warnings} =
    await getFileManifestEntries(options);

  const filePaths = await writeServiceWorkerUsingDefaultTemplate(Object.assign({
    manifestEntries,
  }, options));

  return {count, filePaths, size, warnings};
}

module.exports = generateSW;
