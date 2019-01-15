/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const assert = require('assert');
const fse = require('fs-extra');
const path = require('path');

const checkForDeprecatedOptions =
    require('../lib/check-for-deprecated-options');
const defaults = require('./options/defaults');
const errors = require('../lib/errors');
const getFileManifestEntries = require('../lib/get-file-manifest-entries');
const injectManifestSchema = require('./options/inject-manifest-schema');
const validate = require('./options/validate');

/**
 * This method creates a list of URLs to precache, referred to as a "precache
 * manifest", based on the options you provide.
 *
 * The manifest is injected into the `swSrc` file, and the regular expression
 * `injectionPointRegexp` determines where in the file the manifest should go.
 *
 * The final service worker file, with the manifest injected, is written to
 * disk at `swDest`.
 *
 * @param {Object} config Please refer to the
 * [configuration guide](https://developers.google.com/web/tools/workbox/modules/workbox-build#full_injectmanifest_config).
 * @return {Promise<{count: number, size: number, warnings: Array<string>}>}
 * A promise that resolves once the service worker file has been written to
 * `swDest`. The `size` property contains the aggregate size of all the
 * precached entries, in bytes, and the `count` property contains the total
 * number of precached entries. Any non-fatal warning messages will be returned
 * via `warnings`.
 *
 * @memberof module:workbox-build
 */
async function injectManifest(config) {
  // This check needs to be done before validation, since the deprecated options
  // will be renamed.
  const deprecationWarnings = checkForDeprecatedOptions(config);

  const options = validate(config, injectManifestSchema);

  if (path.normalize(config.swSrc) === path.normalize(config.swDest)) {
    throw new Error(errors['same-src-and-dest']);
  }

  const globalRegexp = new RegExp(options.injectionPointRegexp, 'g');

  const {count, size, manifestEntries, warnings} =
    await getFileManifestEntries(options);
  let swFileContents;
  try {
    swFileContents = await fse.readFile(config.swSrc, 'utf8');
  } catch (error) {
    throw new Error(`${errors['invalid-sw-src']} ${error.message}`);
  }

  const injectionResults = swFileContents.match(globalRegexp);
  assert(injectionResults, errors['injection-point-not-found'] +
    // Customize the error message when this happens:
    // - If the default RegExp is used, then include the expected string that
    //   matches as a hint to the developer.
    // - If a custom RegExp is used, then just include the raw RegExp.
    (options.injectionPointRegexp === defaults.injectionPointRegexp ?
      'workbox.precaching.precacheAndRoute([])' :
      options.injectionPointRegexp));
  assert(injectionResults.length === 1, errors['multiple-injection-points'] +
    ` ${options.injectionPointRegexp}`);

  const entriesString = JSON.stringify(manifestEntries, null, 2);
  swFileContents = swFileContents.replace(globalRegexp, `$1${entriesString}$2`);

  try {
    await fse.mkdirp(path.dirname(options.swDest));
  } catch (error) {
    throw new Error(errors['unable-to-make-injection-directory'] +
      ` '${error.message}'`);
  }

  await fse.writeFile(config.swDest, swFileContents);

  // Add in any deprecation warnings.
  warnings.push(...deprecationWarnings);

  return {count, size, warnings};
}

module.exports = injectManifest;
