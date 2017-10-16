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
 * Generate a service worker using {@link module:workbox-build.generateSWString}
 * or append `importScripts('workbox-sw.<version>.js', 'file-manifest.js')` to
 * an existing service worker if `swSrc` is specified
 *
 * TODO:
 *    allow users to specify a webpack entry name to use as a service worker
 *    instead of just swSrc
 *
 * @function generateOrCopySW
 * @param {module:workbox-build.generateSWString} config
 * @param {string} swSrc path to existing service worker
 * @return {Promise<string>} generated service worker string
 *
 * @memberof module:workbox-webpack-plugin
 */
module.exports = (config, swSrc) => new Promise((resolve, reject) => {
  if (!swSrc) {
    // use workbox-build to generate the service worker
    return resolve(generateSWString(config));
  } else {
    return readFile(swSrc).then((serviceWorkerSource) =>
      // prepend the exsiting service worker with workbox-sw and file-manifest
      resolve(`importScripts(${config.importScripts.map((script) =>
        `'${script}'`)});\n${serviceWorkerSource}`)
    );
  }
});
