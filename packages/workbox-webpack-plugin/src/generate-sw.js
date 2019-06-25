/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const bundle = require('workbox-build/build/lib/bundle');
const populateSWTemplate =
    require('workbox-build/build/lib/populate-sw-template');

const convertStringToAsset = require('./lib/convert-string-to-asset');
const getDefaultConfig = require('./lib/get-default-config');
const getManifestEntriesFromCompilation =
  require('./lib/get-manifest-entries-from-compilation');
const relativeToOutputPath = require('./lib/relative-to-output-path');
const sanitizeConfig = require('./lib/sanitize-config');
const warnAboutConfig = require('./lib/warn-about-config');

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
    this.config = Object.assign(getDefaultConfig(), {
      // Hardcode this default filename, since we don't have swSrc to read from
      // (like we do in InjectManifest).
      swDest: 'service-worker.js',
    }, config);
  }

  /**
   * @param {Object} [compiler] default compiler object passed from webpack
   *
   * @private
   */
  apply(compiler) {
    compiler.hooks.emit.tapPromise(
        this.constructor.name,
        (compilation) => this.handleEmit(compilation)
    );
  }

  /**
   * @param {Object} compilation The webpack compilation.
   *
   * @private
   */
  async handleEmit(compilation) {
    const configWarning = warnAboutConfig(this.config);
    if (configWarning) {
      compilation.warnings.push(configWarning);
    }

    const sanitizedConfig = sanitizeConfig.forGenerateSWString(this.config);
    sanitizedConfig.manifestEntries = getManifestEntriesFromCompilation(
        compilation, sanitizedConfig);

    const unbundledCode = populateSWTemplate(sanitizedConfig);
    const files = await bundle({
      babelPresetEnvTargets: ['chrome >= 56'],
      inlineWorkboxRuntime: false,
      mode: 'development',
      sourcemap: true,
      swDest: relativeToOutputPath(compilation, this.config.swDest),
      unbundledCode,
    });

    for (const file of files) {
      compilation.assets[file.name] = convertStringToAsset(file.contents);
    }
  }
}

module.exports = GenerateSW;
