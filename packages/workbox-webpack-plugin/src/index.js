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
   *
   * @param {Object} [config] All the options as passed to `workbox-build`.
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
    compiler.plugin('make', (compilation, next) => {
      copyWorkboxSW(compilation.options.output.path)
      .then(({workboxSW, workboxSWMap, workboxSWName}) => {
        // Add the workbox-sw file to compilation assets
        compilation.assets[workboxSWName] = webpackAsset(workboxSW);
        compilation.assets[`${workboxSWName}.map`] = webpackAsset(workboxSWMap);
        this.config.set('workboxSWFilename', workboxSWName);
        next();
      });
    });
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
