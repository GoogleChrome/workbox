/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {RawSource} = require('webpack-sources');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const replaceAndUpdateSourceMap = require(
    'workbox-build/build/lib/replace-and-update-source-map');
const sourceMapURL = require('source-map-url');
const stringify = require('fast-json-stable-stringify');
const upath = require('upath');
const validate = require('workbox-build/build/lib/validate-options');
const webpackInjectManifestSchema = require(
    'workbox-build/build/options/schema/webpack-inject-manifest');

const getManifestEntriesFromCompilation =
  require('./lib/get-manifest-entries-from-compilation');
const relativeToOutputPath = require('./lib/relative-to-output-path');

// Used to keep track of swDest files written by *any* instance of this plugin.
// See https://github.com/GoogleChrome/workbox/issues/2181
const _generatedAssetNames = new Set();

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
    this.alreadyCalled = false;
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
    _generatedAssetNames.add(this.config.swDest);

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
    // See https://github.com/GoogleChrome/workbox/issues/1790
    if (this.alreadyCalled) {
      compilation.warnings.push(`${this.constructor.name} has been called ` +
        `multiple times, perhaps due to running webpack in --watch mode. The ` +
        `precache manifest generated after the first call may be inaccurate! ` +
        `Please see https://github.com/GoogleChrome/workbox/issues/1790 for ` +
        `more information.`);
    } else {
      this.alreadyCalled = true;
    }

    const config = Object.assign({}, this.config);

    // Ensure that we don't precache any of the assets generated by *any*
    // instance of this plugin.
    config.exclude.push(({asset}) => _generatedAssetNames.has(asset.name));

    // See https://webpack.js.org/contribute/plugin-patterns/#monitoring-the-watch-graph
    const absoluteSwSrc = upath.resolve(this.config.swSrc);
    compilation.fileDependencies.add(absoluteSwSrc);

    const swAsset = compilation.assets[config.swDest];
    const initialSWAssetString = swAsset.source();
    if (!initialSWAssetString.includes(config.injectionPoint)) {
      throw new Error(`Can't find ${config.injectionPoint} in your SW source.`);
    }

    const manifestEntries = await getManifestEntriesFromCompilation(
        compilation, config);

    const manifestString = stringify(manifestEntries);

    const url = sourceMapURL.getFrom(initialSWAssetString);
    // If our bundled swDest file contains a sourcemap, we would invalidate that
    // mapping if we just replaced injectionPoint with the stringified manifest.
    // Instead, we need to update the swDest contents as well as the sourcemap
    // at the same time.
    // See https://github.com/GoogleChrome/workbox/issues/2235
    if (url) {
      // Translate the relative URL to what the presumed name for the webpack
      // asset should be.
      // TODO: Is there an "official" mapping maintained by webpack of assets to
      // the name of their generated sourcemap?
      const swAssetDirname = upath.dirname(config.swDest);
      const sourcemapURLAssetName = upath.normalize(
          upath.join(swAssetDirname, url));

      const existingSourcemapAsset = compilation.assets[sourcemapURLAssetName];

      if (!existingSourcemapAsset) {
        throw new Error(`Can't find ${sourcemapURLAssetName} in assets.`);
      }

      const {source, map} = await replaceAndUpdateSourceMap({
        jsFilename: config.swDest,
        originalMap: JSON.parse(existingSourcemapAsset.source()),
        originalSource: initialSWAssetString,
        replaceString: manifestString,
        searchString: config.injectionPoint,
      });

      compilation.assets[sourcemapURLAssetName] = new RawSource(map);
      compilation.assets[config.swDest] = new RawSource(source);
    } else {
      // If there's no sourcemap associated with swDest, a simple string
      // replacement will suffice.
      compilation.assets[config.swDest] = new RawSource(
          initialSWAssetString.replace(config.injectionPoint, manifestString));
    }
  }
}

module.exports = InjectManifest;
