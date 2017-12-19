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

const path = require('path');
const {getModuleUrl} = require('workbox-build');

const generateManifest = require('./lib/generate-manifest-with-webpack');
const generateOrCopySW = require('./lib/generate-or-copy-sw');
const getAssetHash = require('./lib/utils/get-asset-hash');
const getEntries = require('./lib/get-manifest-entries-with-webpack');
const formatAsWebpackAsset = require('./lib/utils/format-as-webpack-asset');
const {setReadFile} = require('./lib/utils/read-file');

/**
 * This module exports the `WorkboxWebpackPlugin`.
 *
 * Use an instance of `WorkboxWebpackPlugin` in the
 * [`plugins` array](https://webpack.js.org/concepts/plugins/#usage) of a
 * webpack config.
 *
 * @module workbox-webpack-plugin
 */
class WorkboxWebpackPlugin {
  /**
   * Creates an instance of WorkboxWebpackPlugin.
   *
   * @param {module:workbox-build.Configuration} [config] All the options as
   *        passed to {@link module:workbox-build.generateSWString}.
   * @param {Array<String>} [config.chunks] Array of chunk names to use for
   *        generating the asset manifest. All assets belonging to the provided
   *        chunk names will be included in the asset manifest. Any chunks that
   *        are not listed or do not have a name will be removed.
   * @param {Array<String>} [config.excludeChunks] Array of chunk names to
   *        exclude from the asset manifest. Any asset beloning to the provided
   *        chunk names will not be included in the asset manifest. This does
   *        not affect chunks with no chunk name.
   * @param {string} [config.swSrc] Path to an existing service worker file.
   *        Will be added to the webpack compilation and prepended with
   *        importScripts('workbox-sw.js', 'file-manifest.js')
   */
  constructor(config = {}) {
    this.config = Object.assign({}, {
      chunks: [],
      excludeChunks: [],
      importScripts: [],
      importWorkboxFrom: 'cdn',
    }, config);
  }

  /**
   * @param {Object} compilation The webpack compilation.
   * @private
   */
  async handleEmit(compilation) {
    const {
      importWorkboxFrom,
      swSrc,
    } = this.config;
    const serviceWorkerFilename = swSrc ? path.basename(swSrc) : 'sw.js';

    let workboxSWImport;
    switch (importWorkboxFrom) {
      case 'cdn': {
        workboxSWImport = getModuleUrl('workbox-sw');
        break;
      }

      case 'local': {
        // TODO: Implement.
        break;
      }

      case 'disabled': {
        // No-op.
        break;
      }

      default: {
        // If importWorkboxFrom is anything else, then treat it as the name of
        // a webpack chunk that corresponds to the custom compilation of the
        // Workbox code.
        for (const chunk of compilation.chunks) {
          // Make sure that we actually have a chunk with the appropriate name.
          if (chunk.name === importWorkboxFrom) {
            workboxSWImport = chunk.files;
            this.config.excludeChunks.push(chunk.name);
            break;
          }
        }

        // If there's no chunk with the right name, treat it as a fatal error.
        if (workboxSWImport === undefined) {
          throw Error(`importWorkboxFrom was set to ` +
            `'${importWorkboxFrom}', which is not an existing chunk name.`);
        }
      }
    }

    const entries = getEntries(compilation, this.config);
    const fileManifest = generateManifest(entries);
    const fileManifestAsset = formatAsWebpackAsset(fileManifest);
    const fileManifestHash = getAssetHash(fileManifestAsset);
    const manifestFilename = `precache-manifest.${fileManifestHash}.js`;
    compilation.assets[manifestFilename] = fileManifestAsset;

    this.config.importScripts.push(manifestFilename);

    if (workboxSWImport) {
      this.config.importScripts = this.config.importScripts.concat(
        workboxSWImport);
    }

    const serviceWorker = await generateOrCopySW(this.config, swSrc);
    compilation.assets[serviceWorkerFilename] =
      formatAsWebpackAsset(serviceWorker);
  }

  /**
   * @param {Object} [compiler] default compiler object passed from webpack
   *
   * @private
   */
  apply(compiler) {
    /**
     * The plugin was instantiated and the webpack compilation has just begun.
     * We configure the workbox-webpack-plugin/utils/read-file module to use
     * webpack's compilation.inputFileSystem._readFile method for reading files.
     *
     * TODO: Determine if this is absolutely necessary. It might be possible to
     * only do this in development (when the file system is a "memory" file
     * system). If that is the case, it might be better to set different values
     * for setReadFile using compiler.plugin('run') for production and
     * compiler.plugin('watch-run') for development.
     */
    setReadFile(compiler.inputFileSystem._readFile);

    /**
     * During the emit phase of the webpack compilation, we:
     *  1. Get the manifest entries.
     *  2. Use the entries to generate a file-manifest.
     *  3. Generate a service worker with the file-manifest name and workbox-sw
     *     name, or copy a service worker from the config.swSrc, then prepend
     *     it with the required importScripts(workbox-sw.js, file-manifest.js).
     *  4. Add both the file-manifest and the service worker to the webpack
     *     assets.
     */
    compiler.plugin('emit', (compilation, next) => {
      this.handleEmit(compilation)
        .then(next)
        .catch(next);
    });
  }
}

module.exports = WorkboxWebpackPlugin;
