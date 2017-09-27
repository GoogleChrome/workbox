const assert = require('assert');
const fse = require('fs-extra');
const path = require('path');

const getFileManifestEntries = require('./get-file-manifest-entries');
const errors = require('./errors');
const warnAboutConfig = require('./utils/warn-about-config');

// A list of config options that are valid in some contexts, but not when
// using injectManifest().
const INVALID_CONFIG_OPTIONS = [
  'runtimeCaching',
  'navigateFallback',
  'navigateFallbackWhitelist',
];

/**
 * This method will read an existing service worker file, find an instance of
 * `.precache([])`, and replace the empty array with the contents of a precache
 * manifest. This allows the service worker to efficiently cache assets for
 * offline use, while still giving you control over the rest of the service
 * worker's code.
 *
 * @param {module:workbox-build.Configuration} input
 * @return {Promise} Resolves once the service worker has been written
 * with the injected precache list.
 *
 * @example <caption>Takes an existing service worker file that includes
 * a <code>precache([])</code> placeholder, and injects a manifest of discovered
 * assets into it.</caption>
 * const workboxBuild = require('workbox-build');
 *
 * workboxBuild.injectManifest({
 *   swSrc: './dev/sw.js',
 *   swDest: './dist/sw.js',
 *   globDirectory: './dist/',
 *   globPatterns: ['**\/*.{html,js,css}'],
 *   globIgnores: ['admin.html'],
 *   templatedUrls: {
 *     '/shell': ['dev/templates/app-shell.hbs', 'dev/**\/*.css'],
 *   },
 * })
 * .then(() => {
 *   console.log('Service worker generated.');
 * });
 *
 * @memberof module:workbox-build
 */
async function injectManifest(input) {
  assert(input && typeof input === 'object' && !Array.isArray(input),
    errors['invalid-inject-manifest-arg']);

  const injectionPointRegex = /(\.precache\()\s*\[\s*\]\s*(\))/g;

  const manifestEntries = await getFileManifestEntries(input);
  let swFileContents = await fse.readFile(input.swSrc, 'utf8');

  const injectionResults = swFileContents.match(injectionPointRegex);
  assert(injectionResults, errors['injection-point-not-found']);
  assert(injectionResults.length === 1,
    errors['multiple-injection-points-found']);

  warnAboutConfig(INVALID_CONFIG_OPTIONS, input, 'injectManifest');

  const entriesString = JSON.stringify(manifestEntries, null, 2);
  swFileContents = swFileContents.replace(
    injectionPointRegex, `$1${entriesString}$2`);

  try {
    await fse.mkdirp(path.dirname(input.swDest));
  } catch (error) {
    throw new Error(errors['unable-to-make-injection-directory'] +
      ` '${error.message}'`);
  }

  return fse.writeFile(input.swDest, swFileContents);
}

module.exports = injectManifest;
