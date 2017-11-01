'use strict';

const swBuild = require('workbox-build');
const path = require('path');
const url = require('url');
/**
 * Use the instance of this in the plugins array of the webpack config.
 *
 * @example
 * const WorkboxBuildWebpackPlugin = require('workbox-webpack-plugin');
 * .
 * .
 * module.exports = {
 *   entry: {
 *     app: './step1/app.js'
 *   },
 *   output: {
 *     path: __dirname + '/step1/public/js',
 *     publicPath: '/public/js/',
 *     filename: '[name].js',
 *   },
 *   plugins: [
 *    new WorkboxBuildWebpackPlugin({
 *      globPatterns: ['**\/*.{html,js,css}'],
 *      globIgnores: ['admin.html'],
 *      swSrc: './src/sw.js',
 *      swDest: './build/sw.js',
 *     });
 *   ]
 * }
 *
 * @module workbox-webpack-plugin
 */
class WorkboxBuildWebpackPlugin {
  /**
   * Creates an instance of WorkboxBuildWebpackPlugin.
   *
   * @param {Object} [config] All the options as passed to `workbox-build`.
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
    let config = this._config;

    // If no root directory is given, fallback to
    // output path directory of webpack
    if (!config.globDirectory) {
      config.globDirectory = compilation.options.output.path;
    }

    if (!config.swDest) {
      config.swDest = path.join(compilation.options.output.path, 'sw.js');
    }

    if (!config.globPatterns) {
      config.globPatterns = ['**/*.{html,js,css}'];
    }

    if (compilation.options.output.publicPath) {
      const publicPath = compilation.options.output.publicPath;
      const compiledAssets = [];
      for (let key in compilation.assets) {
        if (Object.prototype.hasOwnProperty.call(compilation.assets, key)) {
          compiledAssets.push(url.resolve(publicPath, key));
        }
      }

      const publicPathTransform = (manifestEntries) =>
          manifestEntries.map((entry) => {
            if (compilation.assets[entry.url]) {
              entry.url = url.resolve(publicPath, entry.url);
            }
              return entry;
          });

      if (Array.isArray(config.manifestTransforms)) {
        config.manifestTransforms.unshift(publicPathTransform);
      } else {
        config.manifestTransforms = [publicPathTransform];
      }
    }

    return config;
  }

  /**
   * @private
   * @param {Object} [compiler] default compiler object passed from webpack
   */
  apply(compiler) {
    compiler.plugin('after-emit', (compilation, callback) => {
      const config = this.getConfig(compilation);
      if (config.swSrc) {
        swBuild.injectManifest(config)
          .then(() => callback())
          .catch((e) => callback(e));
      } else {
        swBuild.generateSW(config)
        .then(() => callback())
        .catch((e) => callback(e));
      }
    });
  }
}

module.exports = WorkboxBuildWebpackPlugin;
