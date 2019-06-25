/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const bundle = require('workbox-build/build/lib/bundle');
const populateSWTemplate =
  require('workbox-build/build/lib/populate-sw-template');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');

const convertStringToAsset = require('./lib/convert-string-to-asset');
const getDefaultConfig = require('./lib/get-default-config');
const relativeToOutputPath = require('./lib/relative-to-output-path');
const sanitizeConfig = require('./lib/sanitize-config');
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
    this.config = Object.assign(getDefaultConfig(), config);
  }

  /**
   * @param {Object} [compiler] default compiler object passed from webpack
   *
   * @private
   */
  apply(compiler) {
    compiler.hooks.emit.tapPromise(
        this.constructor.name,
        (compilation) => this.handleEmit(compilation, compiler)
    );

    compiler.hooks.emit.tapPromise(
        this.constructor.name,
        (compilation) => this.handleEmit(compilation)
    );
  }

  /**
   * @param {Object} compilation The webpack compilation.
   * @param {Object} compiler The webpack parent compiler.
   *
   * @private
   */
  async handleMake(compilation, compiler) {
    const configWarning = warnAboutConfig(this.config);
    if (configWarning) {
      compilation.warnings.push(configWarning);
    }

    // Make sure we don't pass ourselves to the child compiler.
    const plugins = compiler.plugins.filter(
        (plugin) => !(plugin instanceof InjectManifest));
    const childCompiler = compilation.createChildCompiler(
        this.constructor.name, compiler.options, plugins);

    const swEntry = new SingleEntryPlugin(compiler.context,
        this.options.swSrc, this.constructor.name);

    childCompiler.apply(swEntry);

    await new Promise((resolve, reject) => {
      childCompiler.runAsChild((error) => {
        if (error) {
          reject(error);
        } else {
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
    const configWarning = warnAboutConfig(this.config);
    if (configWarning) {
      compilation.warnings.push(configWarning);
    }
  }
}

module.exports = InjectManifest;
