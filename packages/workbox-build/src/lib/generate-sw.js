'use strict';

const path = require('path');
const copyWorkboxSW = require('./utils/copy-workbox-sw');
const getFileManifestEntries = require('./get-file-manifest-entries');
const writeServiceWorker = require('./write-sw');
const errors = require('./errors');
const constants = require('./constants');

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
const generateSW = function(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return Promise.reject(new Error(errors['invalid-generate-sw-input']));
  }

  // Type check input so that defaults can be used if appropriate.
  if (typeof input.globIgnores === 'string') {
    input.globIgnores = [input.globIgnores];
  }
  if (input.globIgnores && !(Array.isArray(input.globIgnores))) {
    return Promise.reject(
      new Error(errors['invalid-glob-ignores']));
  }

  if (typeof input.globDirectory !== 'string' ||
    input.globDirectory.length === 0) {
    return Promise.reject(
      new Error(errors['invalid-glob-directory']));
  }

  if (typeof input.swDest !== 'string' || input.swDest.length === 0) {
    return Promise.reject(
      new Error(errors['invalid-sw-dest']));
  }

  if (input.runtimeCaching && !(Array.isArray(input.runtimeCaching))) {
    return Promise.reject(
      new Error(errors['invalid-runtime-caching']));
  }

  const globDirectory = input.globDirectory;
  input.globIgnores = input.globIgnores || constants.defaultGlobIgnores;
  const swDest = input.swDest;

  let workboxSWImportPath;
  let destDirectory = path.dirname(swDest);
  return copyWorkboxSW(destDirectory)
  .then((libPath) => {
    // If sw file is in build/sw.js, the workboxSW file will be
    // build/workboxSW.***.js. So the sw.js file should import workboxSW.***.js
    // (i.e. not include build/).
    workboxSWImportPath = path.relative(destDirectory, libPath);

    // we will be globbing in the globDirectory, so we need to ignore relative
    // to that path.
    input.globIgnores.push(path.relative(globDirectory, libPath));
    input.globIgnores.push(path.relative(globDirectory, swDest));
  })
  .then(() => {
    return getFileManifestEntries(input);
  })
  .then((manifestEntries) => {
    return writeServiceWorker(
      swDest,
      manifestEntries,
      workboxSWImportPath,
      globDirectory,
      input
    );
  });
};

module.exports = generateSW;
