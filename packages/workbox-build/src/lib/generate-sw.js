const assert = require('assert');
const path = require('path');

const constants = require('./constants');
const copyWorkboxSW = require('./utils/copy-workbox-sw');
const errors = require('./errors');
const getFileManifestEntries = require('./get-file-manifest-entries');
const warnAboutConfig = require('./utils/warn-about-config');
const writeServiceWorker = require('./write-sw');

// A list of config options that are valid in some contexts, but not when
// using generateSW().
const INVALID_CONFIG_OPTIONS = ['swSrc'];

/**
 * This method will generate a working service worker with code to precache
 * any assets found during the build process.
 *
 * @param {module:workbox-build.Configuration} input
 * @return {Promise} Resolves once the service worker has been generated.
 *
 * @example <caption>Generate a complete service worker that will precache
 * the discovered assets.</caption>
 * const workboxBuild = require('workbox-build');
 *
 * workboxBuild.generateSW({
 *   globDirectory: './dist/',
 *   globPatterns: ['**\/*.{html,js,css}'],
 *   globIgnores: ['admin.html'],
 *   swDest: './dist/sw.js',
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
async function generateSW(input) {
  assert(input && typeof input === 'object' && !Array.isArray(input),
    errors['invalid-generate-sw-input']);

  // Type check input so that defaults can be used if appropriate.
  if (typeof input.globIgnores === 'string') {
    input.globIgnores = [input.globIgnores];
  }

  assert(!input.globIgnores || Array.isArray(input.globIgnores),
    errors['invalid-glob-ignores']);

  assert(typeof input.globDirectory === 'string' &&
    input.globDirectory.length !== 0,
    errors['invalid-glob-directory']);

  assert(typeof input.swDest === 'string' && input.swDest.length !== 0,
    errors['invalid-sw-dest']);

  assert(!input.runtimeCaching || Array.isArray(input.runtimeCaching),
    errors['invalid-runtime-caching']);

  warnAboutConfig(INVALID_CONFIG_OPTIONS, input, 'generateSW');

  const globDirectory = input.globDirectory;
  input.globIgnores = input.globIgnores || constants.defaultGlobIgnores;

  const swDest = input.swDest;
  const destDirectory = path.dirname(swDest);
  const pathToWorkboxSWFile = await copyWorkboxSW(destDirectory);

  // If sw file is in build/sw.js, the workboxSW file will be
  // build/workboxSW.***.js. So the sw.js file should import workboxSW.***.js
  // (i.e. not include build/).
  const pathToWorkboxSWFileRelativeToDest = path.relative(destDirectory,
    pathToWorkboxSWFile);

  input.globIgnores.push(path.relative(globDirectory, pathToWorkboxSWFile));
  input.globIgnores.push(path.relative(globDirectory, swDest));

  const manifestEntries = await getFileManifestEntries(input);

  return writeServiceWorker(
    swDest,
    manifestEntries,
    pathToWorkboxSWFileRelativeToDest,
    globDirectory,
    input
  );
}

module.exports = generateSW;
