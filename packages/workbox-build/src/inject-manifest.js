/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const assert = require('assert');
const fse = require('fs-extra');
const upath = require('upath');

const errors = require('./lib/errors');
const escapeRegexp = require('./lib/escape-regexp');
const getFileManifestEntries = require('./lib/get-file-manifest-entries');
const injectManifestSchema = require('./options/schema/inject-manifest');
const rebasePath = require('./lib/rebase-path');
const validate = require('./lib/validate-options');

/**
 * This method creates a list of URLs to precache, referred to as a "precache
 * manifest", based on the options you provide.
 *
 * The manifest is injected into the `swSrc` file, and the placeholder string
 * `injectionPoint` determines where in the file the manifest should go.
 *
 * The final service worker file, with the manifest injected, is written to
 * disk at `swDest`.
 *
 * @param {Object} config Please refer to the
 * [configuration guide](https://developers.google.com/web/tools/workbox/modules/workbox-build#full_injectmanifest_config).
 * @return {Promise<{count: number, filePaths: Array<string>, size: number, warnings: Array<string>}>}
 * A promise that resolves once the service worker and related files
 * (indicated by `filePaths`) has been written to `swDest`. The `size` property
 * contains the aggregate size of all the precached entries, in bytes, and the
 * `count` property contains the total number of precached entries. Any
 * non-fatal warning messages will be returned via `warnings`.
 *
 * @memberof module:workbox-build
 */
async function injectManifest(config) {
  const options = validate(config, injectManifestSchema);

  // Make sure we leave swSrc and swDest out of the precache manifest.
  for (const file of [options.swSrc, options.swDest]) {
    options.globIgnores.push(rebasePath({
      file,
      baseDirectory: options.globDirectory,
    }));
  }

  if (upath.resolve(config.swSrc) === upath.resolve(config.swDest)) {
    throw new Error(errors['same-src-and-dest']);
  }

  const globalRegexp = new RegExp(escapeRegexp(options.injectionPoint), 'g');

  const {count, size, manifestEntries, warnings} =
    await getFileManifestEntries(options);
  let swFileContents;
  try {
    swFileContents = await fse.readFile(config.swSrc, 'utf8');
  } catch (error) {
    throw new Error(`${errors['invalid-sw-src']} ${error.message}`);
  }

  const injectionResults = swFileContents.match(globalRegexp);
  if (!injectionResults) {
    // See https://github.com/GoogleChrome/workbox/issues/2230
    if (upath.resolve(config.swSrc) === upath.resolve(config.swDest)) {
      throw new Error(errors['same-src-and-dest'] + ' ' +
        options.injectionPoint);
    }
    throw new Error(errors['injection-point-not-found'] + ' ' +
      options.injectionPoint);
  }

  assert(injectionResults.length === 1, errors['multiple-injection-points'] +
    options.injectionPoint);

  const entriesString = JSON.stringify(manifestEntries, null, 2);
  swFileContents = swFileContents.replace(globalRegexp, entriesString);

  try {
    await fse.mkdirp(upath.dirname(options.swDest));
  } catch (error) {
    throw new Error(errors['unable-to-make-injection-directory'] +
      ` '${error.message}'`);
  }

  await fse.writeFile(config.swDest, swFileContents);

  // Wrap the single output file in an array to make the return value consistent
  // with generateSW.
  const filePaths = [config.swDest];

  return {count, filePaths, size, warnings};
}

module.exports = injectManifest;
