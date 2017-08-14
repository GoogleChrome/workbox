const swBuild = require('workbox-build');
const path = require('path');
const BasePlugin = require('./base-plugin');
const errors = require('./errors');

/**
 * An instance of this plugin replaces an empty precache() call using
 * [workbox-build:injectManifest]{@link
 * module:workbox-build.injectManifest}.
 *
 * @memberof module:workbox-webpack-plugin
 */
class InjectManifestPlugin extends BasePlugin {
  /**
   * Create a new instance of `InjectManifestPlugin`.
   *
   * @param {Object} [config] All the options as passed to
   * [workbox-build:injectManifest]{@link module:workbox-build.injectManifest}
   * functions. See [workbox-build:injectManifest]{@link
   * module:workbox-build.injectManifest} for all possible options.
   * @param {String} [config.swSrc] When invalid, compilation throws an error.
   * @param {String} [config.swDest] Defaults to `%{outputPath}/sw.js`.
   */
  constructor(config) {
    super(config);
  }
  /**
   * @private
   * @param {Object} compilation The [compilation](https://github.com/webpack/docs/wiki/how-to-write-a-plugin#accessing-the-compilation),
   * passed from Webpack to this plugin.
   * @throws Throws an error if `swSrc` option is invalid.
   * @return {Object} The configuration for a given compilation.
   */
  getConfig(compilation) {
    const config = super.getConfig(compilation);

    if (!config.swSrc) {
      throw new Error(errors['invalid-sw-src']);
    }

    if (!config.swDest) {
      config.swDest = path.join(compilation.options.output.path, 'sw.js');
    }

    return config;
  }
  /**
   * This method uses [workbox-build:injectManifest]{
   * @link module:workbox-build.injectManifest} to generate a manifest file.
   *
   * @private
   * @param {Object} compilation The [compilation](https://github.com/webpack/docs/wiki/how-to-write-a-plugin#accessing-the-compilation),
   * @param {Function} [callback] function that must be invoked when handler
   * finishes running.
   */
  handleAfterEmit(compilation, callback) {
    try {
      const config = this.getConfig(compilation, callback);
      swBuild.injectManifest(config)
        .then(() => callback())
        .catch((e) => callback(e));
    } catch (e) {
      callback(e);
    }
  }
}

module.exports = InjectManifestPlugin;
