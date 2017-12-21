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

const generateManifest = require('./lib/generate-manifest');
const getAssetHash = require('./lib/get-asset-hash');
const getManifestEntries = require('./lib/get-manifest-entries');
const getWorkboxSWImports = require('./lib/get-workbox-sw-imports');
const formatAsWebpackAsset = require('./lib/format-as-webpack-asset');
const sanitizeConfig = require('./lib/sanitize-config');

/**
 * This class supports creating a new, ready-to-use service worker file as
 * part of the webpack compilation process.
 *
 * Use an instance of `GenerateSW` in the
 * [`plugins` array](https://webpack.js.org/concepts/plugins/#usage) of a
 * webpack config.
 *
 * @module workbox-webpack-plugin
 */
class GenerateSW {
  /**
   * Creates an instance of GenerateSW.
   *
   * @param {Object} [config] See the
   * [configuration guide](https://developers.google.com/web/tools/workbox/modules/workbox-webpack-plugin#configuration)
   * for all supported options and defaults.
   */
  constructor(config = {}) {
    this.config = Object.assign({}, {
      chunks: [],
      excludeChunks: [],
      importScripts: [],
      importWorkboxFrom: 'cdn',
      swDest: 'service-worker.js',
    }, config);
  }

  /**
   * @param {Object} compilation The webpack compilation.
   * @private
   */
  async handleEmit(compilation) {
    const workboxSWImports = getWorkboxSWImports(compilation, this.config);
    const entries = getManifestEntries(compilation, this.config);

    const fileManifest = generateManifest(entries);
    const fileManifestAsset = formatAsWebpackAsset(fileManifest);
    const fileManifestHash = getAssetHash(fileManifestAsset);
    const manifestFilename = `precache-manifest.${fileManifestHash}.js`;
    compilation.assets[manifestFilename] = fileManifestAsset;
    this.config.importScripts.push(manifestFilename);

    // workboxSWImports might be null if importWorkboxFrom is 'disabled'.
    if (workboxSWImports) {
      // workboxSWImport is an array, so use concat() rather than push().
      this.config.importScripts = this.config.importScripts.concat(
        workboxSWImports);
    }

    // Pull out swDest before it's "sanitized" from the config.
    const {swDest} = this.config;
    const sanitizedConfig = sanitizeConfig(this.config);
    const serviceWorker = await generateSWString(sanitizedConfig);
    compilation.assets[swDest] = formatAsWebpackAsset(serviceWorker);
  }

  /**
   * @param {Object} [compiler] default compiler object passed from webpack
   *
   * @private
   */
  apply(compiler) {
    compiler.plugin('emit', (compilation, next) => {
      this.handleEmit(compilation)
        .then(next)
        .catch(next);
    });
  }
}

module.exports = GenerateSW;
