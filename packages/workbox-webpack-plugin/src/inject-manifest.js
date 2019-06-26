/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {ConcatSource} = require('webpack-sources');
const path = require('path');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');

const getDefaultConfig = require('./lib/get-default-config');
const getManifestEntriesFromCompilation =
  require('./lib/get-manifest-entries-from-compilation');
const sanitizeConfig = require('./lib/sanitize-config');
const stringifyManifest = require('./lib/stringify-manifest');
const warnAboutConfig = require('./lib/warn-about-config');

/**
 * This class supports compiling a service worker file provided via `swSrc`,
 * and injecting into that service worker a list of URLs and revision
 * information for precaching based on the webpack asset pipeline.
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
    this.config = Object.assign(getDefaultConfig(), {
      swDest: path.basename(config.swSrc),
    }, config);
  }

  /**
   * @param {Object} [compiler] default compiler object passed from webpack
   *
   * @private
   */
  apply(compiler) {
    compiler.hooks.make.tapPromise(
        this.constructor.name,
        (compilation) => this.handleMake(compilation, compiler)
    );

    compiler.hooks.emit.tapPromise(
        this.constructor.name,
        (compilation) => this.handleEmit(compilation)
    );
  }

  /**
   * @param {Object} compilation The webpack compilation.
   * @param {Object} parentCompiler The webpack parent compiler.
   *
   * @private
   */
  async handleMake(compilation, parentCompiler) {
    const configWarning = warnAboutConfig(this.config);
    if (configWarning) {
      compilation.warnings.push(configWarning);
    }

    const outputOptions = {
      path: parentCompiler.options.output.path,
      filename: this.config.swDest,
    };

    const childCompiler = compilation.createChildCompiler(
        this.constructor.name, outputOptions);

    childCompiler.context = parentCompiler.context;
    childCompiler.inputFileSystem = parentCompiler.inputFileSystem;
    childCompiler.outputFileSystem = parentCompiler.outputFileSystem;

    new SingleEntryPlugin(
        parentCompiler.context,
        this.config.swSrc,
        this.constructor.name
    ).apply(childCompiler);

    await new Promise((resolve, reject) => {
      childCompiler.runAsChild((error, entries, childCompilation) => {
        if (error) {
          reject(error);
        } else {
          compilation.warnings = compilation.warnings.concat(
              childCompilation.warnings);
          compilation.errors = compilation.errors.concat(
              childCompilation.errors);

          resolve();
        }
      });
    });
  }

  /**
   * @param {Object} compilation The webpack compilation.
   *
   * @private
   */
  async handleEmit(compilation) {
    const swAsset = compilation.assets[this.config.swDest];
    delete compilation.assets[this.config.swDest];

    const sanitizedConfig = sanitizeConfig.forGetManifest(this.config);

    const manifestEntries = getManifestEntriesFromCompilation(
        compilation, sanitizedConfig);
    const manifestDeclaration = stringifyManifest(manifestEntries,
        this.config.injectionPoint);

    compilation.assets[this.config.swDest] = new ConcatSource(
        manifestDeclaration, swAsset || '');
  }
}

module.exports = InjectManifest;
