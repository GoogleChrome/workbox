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

const assert = require('assert');
const path = require('path');

const formatAsWebpackAsset = require('./lib/format-as-webpack-asset');
const generateManifest = require('./lib/generate-manifest');
const getAssetHash = require('./lib/get-asset-hash');
const getManifestEntries = require('./lib/get-manifest-entries');
const getWorkboxSWImports = require('./lib/get-workbox-sw-imports');
const readFileWrapper = require('./lib/read-file-wrapper');

/**
 * This class supports taking an existing service worker file which already
 * uses Workbox, and injecting a reference to a [precache manifest]() into it,
 * allowing it to efficiently precache the assets created by a webpack build.
 *
 * Use an instance of `InjectManifest` in the
 * [`plugins` array](https://webpack.js.org/concepts/plugins/#usage) of a
 * webpack config.
 *
 * @module workbox-webpack-plugin
 */
class InjectManifest {
  /**
   * Creates an instance of InjectManifest.
   *
   * @param {Object} [config] See the
   * [configuration guide](https://developers.google.com/web/tools/workbox/modules/workbox-webpack-plugin#configuration)
   * for all supported options and defaults.
   */
  constructor(config = {}) {
    assert(typeof config.swSrc === 'string', `swSrc must be set to the path ` +
      `to an existing service worker file.`);

    this.config = Object.assign({}, {
      chunks: [],
      excludeChunks: [],
      importScripts: [],
      importWorkboxFrom: 'cdn',
      swDest: path.basename(config.swSrc),
    }, config);
  }

  /**
   * @param {Object} compilation The webpack compilation.
   * @param {Function} readFile The function to use when reading files,
   * derived from compiler.inputFileSystem.
   * @private
   */
  async handleEmit(compilation, readFile) {
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

    const originalSWSrc = await readFileWrapper(readFile, this.config.swSrc);

    const importScriptsString = this.config.importScripts
      .map(JSON.stringify)
      .join(', ');
    const postInjectionSWSrc = `importScripts(${importScriptsString});

${originalSWSrc}
`;

    compilation.assets[this.config.swDest] =
      formatAsWebpackAsset(postInjectionSWSrc);
  }

  /**
   * @param {Object} [compiler] default compiler object passed from webpack
   *
   * @private
   */
  apply(compiler) {
    compiler.plugin('emit', (compilation, next) => {
      this.handleEmit(compilation, compiler.inputFileSystem._readFile)
        .then(next)
        .catch(next);
    });
  }
}

module.exports = InjectManifest;
