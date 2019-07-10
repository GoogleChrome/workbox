/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {ConcatSource} = require('webpack-sources');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const path = require('path');
const validate = require('workbox-build/build/entry-points/options/validate');
const webpackInjectManifestSchema = require(
    'workbox-build/build/entry-points/options/webpack-inject-manifest-schema');

const getManifestEntriesFromCompilation =
  require('./lib/get-manifest-entries-from-compilation');
const relativeToOutputPath = require('./lib/relative-to-output-path');
const stringifyManifest = require('./lib/stringify-manifest');

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
    this.config = config;
  }

  /**
   * @param {Object} [compiler] default compiler object passed from webpack
   *
   * @private
   */
  propagateWebpackConfig(compiler) {
    // Because this.config is listed last, properties that are already set
    // there take precedence over derived properties from the compiler.
    this.config = Object.assign({
      mode: compiler.mode,
    }, this.config);
  }

  /**
   * @param {Object} [compiler] default compiler object passed from webpack
   *
   * @private
   */
  apply(compiler) {
    this.propagateWebpackConfig(compiler);

    compiler.hooks.make.tapPromise(
        this.constructor.name,
        (compilation) => this.handleMake(compilation, compiler).catch(
            (error) => compilation.errors.push(error))
    );

    compiler.hooks.emit.tapPromise(
        this.constructor.name,
        (compilation) => this.handleEmit(compilation).catch(
            (error) => compilation.errors.push(error))
    );
  }

  /**
   * @param {Object} compilation The webpack compilation.
   * @param {Object} parentCompiler The webpack parent compiler.
   *
   * @private
   */
  async handleMake(compilation, parentCompiler) {
    try {
      this.config = validate(this.config, webpackInjectManifestSchema);
    } catch (error) {
      throw new Error(`Please check your ${this.constructor.name} plugin ` +
        `configuration:\n${error.message}`);
    }

    this.config.swDest = relativeToOutputPath(compilation, this.config.swDest);

    const outputOptions = {
      path: parentCompiler.options.output.path,
      filename: this.config.swDest,
    };

    const childCompiler = compilation.createChildCompiler(
        this.constructor.name,
        outputOptions,
        this.config.webpackCompilationPlugins
    );

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
    // See https://webpack.js.org/contribute/plugin-patterns/#monitoring-the-watch-graph
    const absoluteSwSrc = path.resolve(this.config.swSrc);
    compilation.fileDependencies.add(absoluteSwSrc);

    const swAsset = compilation.assets[this.config.swDest];
    delete compilation.assets[this.config.swDest];

    const manifestEntries = getManifestEntriesFromCompilation(
        compilation, this.config);

    const manifestDeclaration = stringifyManifest(manifestEntries,
        this.config.injectionPoint, this.config.mode !== 'production');

    compilation.assets[this.config.swDest] = new ConcatSource(
        manifestDeclaration, swAsset || '');
  }
}

module.exports = InjectManifest;
