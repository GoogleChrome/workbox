/*
  Copyright 2017 Google Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
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
    'excludeChunks',
    'importScripts',
    'importWorkboxFrom',
    'swDest',
    'swSrc',
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
    'excludeChunks',
    'importWorkboxFrom',
    'swDest',
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
