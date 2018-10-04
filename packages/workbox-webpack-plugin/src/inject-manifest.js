/*
  Copyright 2017 Google Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

const assert = require('assert');
const path = require('path');
const {getManifest} = require('workbox-build');

const convertStringToAsset = require('./lib/convert-string-to-asset');
const getDefaultConfig = require('./lib/get-default-config');
const formatManifestFilename = require('./lib/format-manifest-filename');
const getAssetHash = require('./lib/get-asset-hash');
const getManifestEntriesFromCompilation =
  require('./lib/get-manifest-entries-from-compilation');
const getWorkboxSWImports = require('./lib/get-workbox-sw-imports');
const readFileWrapper = require('./lib/read-file-wrapper');
const relativeToOutputPath = require('./lib/relative-to-output-path');
const sanitizeConfig = require('./lib/sanitize-config');
const stringifyManifest = require('./lib/stringify-manifest');
const warnAboutConfig = require('./lib/warn-about-config');

/**
 * This class supports taking an existing service worker file which already
 * uses Workbox, and injecting a reference to a [precache manifest]() into it,
 * allowing it to efficiently precache the assets created by a webpack build.
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
    assert(typeof config.swSrc === 'string', `swSrc must be set to the path ` +
      `to an existing service worker file.`);

    this.config = Object.assign(getDefaultConfig(), {
      // Default to using the same filename as the swSrc file, since that's
      // provided here. (In GenerateSW, that's not available.)
      swDest: path.basename(config.swSrc),
    }, config);
  }

  /**
   * @param {Object} compilation The webpack compilation.
   * @param {Function} readFile The function to use when reading files,
   * derived from compiler.inputFileSystem.
   * @private
   */
  async handleEmit(compilation, readFile) {
    const configWarning = warnAboutConfig(this.config);
    if (configWarning) {
      compilation.warnings.push(configWarning);
    }

    const workboxSWImports = await getWorkboxSWImports(
        compilation, this.config);

    // this.config.modulePathPrefix may or may not have been set by
    // getWorkboxSWImports(), depending on the other config options. If it was
    // set, we need to pull it out and make use of it later, as it can't be
    // used by the underlying workbox-build getManifest() method.
    const modulePathPrefix = this.config.modulePathPrefix;
    delete this.config.modulePathPrefix;

    let entries = getManifestEntriesFromCompilation(compilation, this.config);
    const importScriptsArray = [].concat(this.config.importScripts);

    const sanitizedConfig = sanitizeConfig.forGetManifest(this.config);
    // If there are any "extra" config options remaining after we remove the
    // ones that are used natively by the plugin, then assume that they should
    // be passed on to workbox-build.getManifest() to generate extra entries.
    if (Object.keys(sanitizedConfig).length > 0) {
      // If globPatterns isn't explicitly set, then default to [], instead of
      // the workbox-build.getManifest() default.
      sanitizedConfig.globPatterns = sanitizedConfig.globPatterns || [];

      const {manifestEntries, warnings} = await getManifest(sanitizedConfig);
      compilation.warnings = compilation.warnings.concat(warnings || []);
      entries = entries.concat(manifestEntries);
    }

    const manifestString = stringifyManifest(entries);
    const manifestAsset = convertStringToAsset(manifestString);
    const manifestHash = getAssetHash(manifestAsset);

    const manifestFilename = formatManifestFilename(
        this.config.precacheManifestFilename, manifestHash);

    const pathToManifestFile = relativeToOutputPath(
        compilation, path.join(this.config.importsDirectory, manifestFilename));
    compilation.assets[pathToManifestFile] = manifestAsset;

    importScriptsArray.push((compilation.options.output.publicPath || '') +
      pathToManifestFile.split(path.sep).join('/'));

    // workboxSWImports might be null if importWorkboxFrom is 'disabled'.
    if (workboxSWImports) {
      importScriptsArray.push(...workboxSWImports);
    }

    const originalSWString = await readFileWrapper(readFile, this.config.swSrc);

    // compilation.fileDependencies needs absolute paths.
    const absoluteSwSrc = path.resolve(this.config.swSrc);
    if (Array.isArray(compilation.fileDependencies)) {
      // webpack v3
      if (compilation.fileDependencies.indexOf(absoluteSwSrc) === -1) {
        compilation.fileDependencies.push(absoluteSwSrc);
      }
    } else if ('add' in compilation.fileDependencies) {
      // webpack v4; no need to check for membership first, since it's a Set.
      compilation.fileDependencies.add(absoluteSwSrc);
    }

    const importScriptsString = importScriptsArray
        .map(JSON.stringify)
        .join(', ');

    const setConfigString = modulePathPrefix
      ? `workbox.setConfig({modulePathPrefix: ` +
        `${JSON.stringify(modulePathPrefix)}});`
      : '';

    const postInjectionSWString = `importScripts(${importScriptsString});
${setConfigString}
${originalSWString}
`;

    const relSwDest = relativeToOutputPath(compilation, this.config.swDest);
    compilation.assets[relSwDest] = convertStringToAsset(postInjectionSWString);
  }

  /**
   * @param {Object} [compiler] default compiler object passed from webpack
   *
   * @private
   */
  apply(compiler) {
    const readFile = compiler.inputFileSystem.readFile
        .bind(compiler.inputFileSystem);
    if ('hooks' in compiler) {
      // We're in webpack 4+.
      compiler.hooks.emit.tapPromise(
          this.constructor.name,
          (compilation) => this.handleEmit(compilation, readFile)
      );
    } else {
      // We're in webpack 2 or 3.
      compiler.plugin('emit', (compilation, callback) => {
        this.handleEmit(compilation, readFile)
            .then(callback)
            .catch(callback);
      });
    }
  }
}

module.exports = InjectManifest;
