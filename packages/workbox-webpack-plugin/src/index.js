const path = require('path');
const getEntries = require('./lib/get-webpack-manifest-entries');
const generateManifest = require('./lib/generate-webpack-manifest');
const generateSW = require('./lib/generate-webpack-sw');
const webpackAsset = require('./lib/utils/webpack-asset');
const copyWorkboxSW = require('./lib/utils/copy-workbox-sw');
const {setReadFile} = require('./lib/utils/read-file');

/**
 * Use the instance of this in the plugins array of the webpack config.
 *
 * @example
 * const WorkboxBuildWebpackPlugin = require('workbox-webpack-plugin');
 * .
 * module.exports = {
 *   ...
 *   plugins: [
 *    new WorkboxBuildWebpackPlugin({
 *      chunks: ['main'],
 *      excludeChunks: ['mutable'],
 *      manifestFilename: string,
 *      manifestVarName: '__file_manifest',
 *      swSrc: './src/sw.js',
 *     });
 *   ]
 * };
 *
 * @module workbox-webpack-plugin
 */
class WorkboxWebpackPlugin {
  /**
   * Creates an instance of WorkboxBuildWebpackPlugin.
   * @param {module:workbox-build.Configuration} [config] All the options as
   *        passed to `workbox-build`.
   * @param {Array<String>} [config.chunks] Array of chunk names to use for
   *        generating the asset manifest. All assets belonging to the provided
   *        chunk names will be included in the asset manifest. Any chunks that
   *        are not listed or do not have a name will be removed.
   * @param {Array<String>} [config.excludeChunks] Array of chunk names to
   *        exclude from the asset manifest. Any asset beloning to the provided
   *        chunk names will not be included in the asset manifest. This does
   *        not affect chunks with no chunk name.
   */
  constructor(config) {
    this._config = config || {};
  }

  /**
   * @private
   * @return {Object} The configuration for a given compilation.
   */
  get config() {
    return {
      get: () => Object.assign({}, this._config),
      set: (key, value) => {
        this._config[key] = value;
      },
    };
  }

  /**
   * @private
   * @param {Object} [compiler] default compiler object passed from webpack
   */
  apply(compiler) {
    compiler.plugin('run', (compilation, next) => {
      const readFile = compiler.inputFileSystem._readFile;
      setReadFile(readFile);
      next();
    });
    /**
     * During the make phase of the webpack compilation, we use
     * workbox-webpack-plugin/utils/copy-workbox-sw to add a built version of
     * workbox-sw to the webpack compilation assets array.
     */
    compiler.plugin('make', (compilation, next) => {
      copyWorkboxSW(compilation.options.output.path)
      .then(({workboxSW, workboxSWMap, workboxSWName}) => {
        // Add the workbox-sw file to compilation assets
        compilation.assets[workboxSWName] = webpackAsset(workboxSW);
        compilation.assets[`${workboxSWName}.map`] = webpackAsset(workboxSWMap);
        // The version of workbox-sw is included in it's filename so we need
        // that information to import it in the generated service worker.
        // workbox-webpack-plugin/utils/copy-workbox-sw also returns the
        // workbox-sw filename so we can pass it to
        // workbox-webpack-plugin/generate-webpack-sw.
        this.config.set('workboxSWFilename', workboxSWName);
        next();
      });
    });
    /**
     * During the emit phase of the webpack lifecycle, we:
     *  1. Get the manifest entries
     *  2. Use the entries to generate a file-manifest
     *  3. Generate a service worker with the file-manifest name and workbox-sw
     *     filename or copy a service worker from the config.swSrc then prepend
     *     it with the required importScripts(workbox-sw.js, file-manifest.js).
     *  4. Add both the file-manifest and the service-worker to the webpack
     *     assets.
     * @type {[type]}
     */
    compiler.plugin('emit', (compilation, next) => {
      const config = this.config.get();
      const {
        manifestFilename = `file-manifest.${compilation.hash}.js`,
        manifestVarName = '__file_manifest',
        workboxSWFilename,
        swSrc,
      } = config;

      const swFilename = swSrc
        ? path.basename(swSrc)
        : 'sw.js';

      const entries = getEntries(compiler, compilation, config);

      Promise.all([
        // service worker and fileManifest are not (yet) assets when the
        // manifest is generated
        generateManifest(entries, manifestVarName),
        generateSW(
          {workboxSWFilename, manifestFilename, manifestVarName},
          swSrc
        ),
      ])
      .then(([fileManifest, serviceWorker]) => {
        // add the manifest to the webpack assets
        compilation.assets[manifestFilename] = webpackAsset(fileManifest);
        // add the service worker file
        compilation.assets[swFilename] = webpackAsset(serviceWorker);
        next();
      });
    });
  }
}

module.exports = WorkboxWebpackPlugin;
