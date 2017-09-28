const assert = require('assert');
const fse = require('fs-extra');
const path = require('path');

const InjectManifestOptions = require('./options/inject-manifest-options');
const errors = require('../lib/errors');
const getFileManifestEntries = require('../lib/get-file-manifest-entries');

/**
 * @memberof module:workbox-build
 */
async function injectManifest(input) {
  const options = new InjectManifestOptions(input);

  const globalRegexp = new RegExp(options.injectionPointRegexp, 'g');

  const manifestEntries = await getFileManifestEntries(options);
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

  return fse.writeFile(input.swDest, swFileContents);
}

module.exports = injectManifest;
