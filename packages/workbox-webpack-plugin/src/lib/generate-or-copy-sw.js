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

const {generateSWString} = require('workbox-build');
const {readFile} = require('./utils/read-file');

/**
 * Given a config object, remove the properties that we know are webpack-plugin
 * specific, so that the remaining properties can be passed through to
 * generateSWString().
 *
 * @param {Object} config
 * @return {Object}
 *
 * @private
 */
function sanitizeConfig(config) {
  const propertiesToRemove = [
    'chunks',
    'excludeChunks',
    'importWorkboxFrom',
  ];

  for (const property of propertiesToRemove) {
    delete config[property];
  }

  return config;
}

/**
 * Generate a service worker using {@link module:workbox-build.generateSWString}
 * or append `importScripts('workbox-sw.<version>.js', 'file-manifest.js')` to
 * an existing service worker if `swSrc` is specified
 *
 * TODO:
 *    allow users to specify a webpack entry name to use as a service worker
 *    instead of just swSrc
 *
 * @function generateOrCopySW
 * @param {Object} config Configuration to pass through to
 * {@link module:workbox-build.generateSWString}.
 * @param {string} [swSrc] The path to existing service worker.
 * @return {Promise<string>} The generated service worker string.
 *
 * @private
 */
module.exports = async (config, swSrc) => {
  if (!swSrc) {
    // use workbox-build to generate the service worker.
    return generateSWString(sanitizeConfig(config));
  } else {
    const serviceWorkerSource = await readFile(swSrc);
    const scripts = config.importScripts
      .map((script) => `'${script}'`)
      .join(', ');
    return `importScripts(${scripts});\n${serviceWorkerSource}`;
  }
};
