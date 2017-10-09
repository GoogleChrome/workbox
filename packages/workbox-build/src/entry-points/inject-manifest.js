const assert = require('assert');
const fse = require('fs-extra');
const path = require('path');

const InjectManifestOptions = require('./options/inject-manifest-options');
const errors = require('../lib/errors');
const getFileManifestEntries = require('../lib/get-file-manifest-entries');

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
 * @param {Object} input
 * @return {Promise<{count: Number, size: Number}>} A promise that resolves once
 * the service worker file has been written to `swDest`. The `size` property
 * contains the aggregate size of all the precached entries, in bytes, and the
 * `count` property contains the total number of precached entries.
 *
 * @memberof module:workbox-build
 */
async function injectManifest(input) {
  const options = new InjectManifestOptions(input);

  if (path.normalize(input.swSrc) === path.normalize(input.swDest)) {
    throw new Error(errors['same-src-and-dest']);
  }

  const globalRegexp = new RegExp(options.injectionPointRegexp, 'g');

  const {count, size, manifestEntries} = await getFileManifestEntries(options);
  let swFileContents;
  try {
    swFileContents = await fse.readFile(input.swSrc, 'utf8');
  } catch (error) {
    throw new Error(`${errors['invalid-sw-src']} ${error.message}`);
  }

  const injectionResults = swFileContents.match(globalRegexp);
  assert(injectionResults, errors['injection-point-not-found'] +
    ` ${options.injectionPointRegexp}`);
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

  await fse.writeFile(input.swDest, swFileContents);

  return {count, size};
}

module.exports = injectManifest;
