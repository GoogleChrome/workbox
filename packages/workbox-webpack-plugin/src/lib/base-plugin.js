/**
 * @private
 *
 * Base abstract class for webpack plugins. Implements common config validation
 * and hooks to a webpack compilation event.
 *
 * Children of this class must implement
 * [handleAfterEmit(compilation, callback)]{@link
 *   module.workbox-webpack-plugin.BasePlugin#handleAfterEmit}.
 *
 * @memberof module:workbox-webpack-plugin
 */
class BasePlugin {
  /**
   * Creates a new plugin instance.
   *
   * @param {Object} [config] All the options as passed to
   * [workbox-build]{@link module:workbox-build} functions.
   */
  constructor(config) {
    this._config = config || {};
  }

  /**
   * @private
   * @param {Object} compilation The [compilation](https://github.com/webpack/docs/wiki/how-to-write-a-plugin#accessing-the-compilation),
   * passed from Webpack to this plugin.
   * @return {Object} The configuration for a given compilation.
   */
  getConfig(compilation) {
    const config = Object.assign({}, this._config);

    // If no root directory is given, fallback to
    // output path directory of webpack
    if (!config.globDirectory) {
      config.globDirectory = compilation.options.output.path;
    }

    if (!config.globPatterns) {
      config.globPatterns = ['**/*.{html,js,css}'];
    }

    return config;
  }

  /**
   * @private
   * @param {Object} [compiler] default compiler object passed from webpack
   */
  apply(compiler) {
    compiler.plugin('after-emit', (compilation, callback) => {
      this.handleAfterEmit(compilation, callback);
    });
  }

  /**
   * @private
   * @param {Object} [compilation] compilation object passed from webpack
   * @param {Function} [callback] function that must be invoked when handler
   * finishes running.
   */
  handleAfterEmit(compilation, callback) {
  }
}

module.exports = BasePlugin;
