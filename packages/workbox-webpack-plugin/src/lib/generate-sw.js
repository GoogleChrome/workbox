const swBuild = require('workbox-build');
const path = require('path');
const BasePlugin = require('./base-plugin');

/**
 * An instance of this plugin generates a service-worker file using
 * [workbox-build:generateSW]{@link module:workbox-build.generateSW}.
 *
 * @memberof module:workbox-webpack-plugin
 */
class GenerateSWPlugin extends BasePlugin {
  /**
   * Create a new instance of `GenerateSWPlugin`.
   *
   * @param {Object} [config] All the options as passed to
   * [workbox-build:generateSW]{@link module:workbox-build.generateSW}. See
   * [workbox-build:generateSW]{@link module:workbox-build.generateSW} for all
   * possible options.
   * functions.
   * @param {String} [config.swDest] Defaults to `%{outputPath}/sw.js`.
   */
  constructor(config) {
    super(config);
  }
  /**
   * @private
   * @param {Object} compilation The [compilation](https://github.com/webpack/docs/wiki/how-to-write-a-plugin#accessing-the-compilation),
   * passed from Webpack to this plugin.
   * @return {Object} The configuration for a given compilation.
   */
  getConfig(compilation) {
    const config = super.getConfig(compilation);

    if (!config.swDest) {
      config.swDest = path.join(compilation.options.output.path, 'sw.js');
    }

    return config;
  }

  /**
   * This method uses [workbox-build:generateSW]{
   * @link module:workbox-build.generateSW} to generate a service worker file.
   *
   * @private
   * @param {Object} compilation The [compilation](https://github.com/webpack/docs/wiki/how-to-write-a-plugin#accessing-the-compilation),
   * @param {Function} [callback] function that must be invoked when handler
   * finishes running.
   */
  handleAfterEmit(compilation, callback) {
    const config = this.getConfig(compilation);
    swBuild.generateSW(config)
      .then(() => callback())
      .catch((e) => callback(e));
  }
}

module.exports = GenerateSWPlugin;
