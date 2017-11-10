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
const getEntries = require('./lib/get-manifest-entries-with-webpack');
const generateManifest = require('./lib/generate-manifest-with-webpack');
const generateOrCopySW = require('./lib/generate-or-copy-sw');
const webpackAsset = require('./lib/utils/webpack-asset');
const copyWorkboxSW = require('./lib/utils/copy-workbox-sw');
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
   * @param {string} [config.filename = 'sw.js'] Name of the service worker file
   * @param {string} [config.manifestFilename = 'file-manifest[hash].js'] Name
   *        of the manifest file that will be written to the build directory
   * @param {string} [config.swSrc] Path to an existing service worker file.
   *        Will be added to the webpack compilation and prepended with
   *        importScripts('workbox-sw.js', 'file-manifest.js')
   */
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * @return {Object} All workbox configuration options that can be accepted
   * by {@link module:workbox-build.generateSWString}
   *
   * @private
   */
  get generateSWStringOptions() {
    const {
      importScripts = [],
      // TODO: decide on other options that should be passed to
      // `generateSWString`. What operations should be possible for webpack
      // users? eg, should webpack users also be able to specify a
      // `globDirectory` that allows manifestEntries to be added that are
      // outside webpack's scope?
    } = this.config;

    return {
      importScripts,
    };
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
     * During the make phase of the webpack compilation, we use
     * workbox-webpack-plugin/utils/copy-workbox-sw to add a built version of
     * workbox-sw to the webpack compilation assets array.
     */
    compiler.plugin('make', async (compilation, next) => {
      const {
        workboxSW,
        workboxSWMap,
        workboxSWName,
      } = await copyWorkboxSW();

      // Add the workbox-sw file to compilation assets.
      compilation.assets[workboxSWName] = webpackAsset(workboxSW);
      compilation.assets[`${workboxSWName}.map`] = webpackAsset(workboxSWMap);
      // The version of workbox-sw is included in it's filename so we need
      // that information to import it in the generated service worker.
      this.workboxSWFilename = workboxSWName;
      next();
    });

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
    compiler.plugin('emit', async (compilation, next) => {
      const {
        manifestFilename = `file-manifest.${compilation.hash}.js`,
        swSrc,
        filename = (swSrc && path.basename(swSrc)) || 'sw.js',
      } = this.config;

      const entries = getEntries(compiler, compilation, this.config);

      const importScripts = (this.config.importScripts || []).concat([
        this.workboxSWFilename,
        manifestFilename,
      ]);

      const [fileManifest, serviceWorker] = await Promise.all([
        // service worker and fileManifest are not (yet) assets when the
        // manifest is generated
        generateManifest(entries),
        generateOrCopySW(
          Object.assign(this.generateSWStringOptions, {
            importScripts,
          }),
          swSrc
        ),
      ]);

      compilation.assets[manifestFilename] = webpackAsset(fileManifest);
      compilation.assets[filename] = webpackAsset(serviceWorker);
      next();
    });
  }
}

module.exports = WorkboxWebpackPlugin;
