const swBuild = require('workbox-build');
const path = require('path');
const BasePlugin = require('./base-plugin');

/**
 * An instance of this plugin generates a manifest file using
 * [workbox-build:generateFileManifest]{@link
 * module:workbox-build.generateFileManifest}.
 *
 * @memberof module:workbox-webpack-plugin
 */
class GenerateFileManifestPlugin extends BasePlugin {
  /**
   * Create a new instance of `GenerateFileManifestPlugin`.
   *
   * @param {Object} [config] All the options as passed to
   * [workbox-build:generateFileManifest]{@link
   * module:workbox-build.generateFileManifest}. See
   * [workbox-build:generateFileManifest]{@link
   * module:workbox-build.generateFileManifest} for all possible options.
   * @param {String} [config.manifestDest] Defaults to
   * `${outputPath}/precache-manifest.js`.
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

    if (!config.manifestDest) {
      config.manifestDest = path.join(
        compilation.options.output.path,
        'precache-manifest.js'
      );
    }

    return config;
  }

  /**
   * This method uses [workbox-build:generateFileManifest]{
   * @link module:workbox-build.generateFileManifest} to generate a manifest
   * file.
   *
   * @private
   * @param {Object} compilation The [compilation](https://github.com/webpack/docs/wiki/how-to-write-a-plugin#accessing-the-compilation),
   * @param {Function} [callback] function that must be invoked when handler
   * finishes running.
   */
  handleAfterEmit(compilation, callback) {
    const config = this.getConfig(compilation);
    swBuild.generateFileManifest(config)
      .then(() => callback())
      .catch((e) => callback(e));
  }
}

module.exports = GenerateFileManifestPlugin;
