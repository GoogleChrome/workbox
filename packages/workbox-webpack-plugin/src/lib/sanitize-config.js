/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

/**
 * Helper method that sanitizes the config based on what
 * workbox-build.getManifest() expects.
 *
 * @param {Object} originalConfig
 * @return {Object} Sanitized config.
 * @private
 */
function forGetManifest(originalConfig) {
  const propertiesToRemove = [
    'chunks',
    'exclude',
    'excludeChunks',
    'importScripts',
    'importWorkboxFrom',
    'importsDirectory',
    'include',
    'precacheManifestFilename',
    'swDest',
    'swSrc',
    'test',
  ];

  return sanitizeConfig(originalConfig, propertiesToRemove);
}

/**
 * Helper method that sanitizes the config based on what
 * workbox-build.generateSWString() expects.
 *
 * @param {Object} originalConfig
 * @return {Object} Sanitized config.
 * @private
 */
function forGenerateSWString(originalConfig) {
  const propertiesToRemove = [
    'chunks',
    'exclude',
    'excludeChunks',
    'importWorkboxFrom',
    'importsDirectory',
    'include',
    'precacheManifestFilename',
    'swDest',
    'test',
  ];

  return sanitizeConfig(originalConfig, propertiesToRemove);
}

/**
 * Given a config object, make a shallow copy via Object.assign(), and remove
 * the properties from the copy that we know are webpack-plugin
 * specific, so that the remaining properties can be passed through to the
 * appropriate workbox-build method.
 *
 * @param {Object} originalConfig
 * @param {Array<string>} propertiesToRemove
 * @return {Object} A copy of config, sanitized.
 *
 * @private
 */
function sanitizeConfig(originalConfig, propertiesToRemove) {
  const config = Object.assign({}, originalConfig);

  for (const property of propertiesToRemove) {
    delete config[property];
  }

  return config;
}

module.exports = {
  forGetManifest,
  forGenerateSWString,
};
