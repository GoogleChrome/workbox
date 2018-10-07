/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

/**
 * @return {Object} A fresh object with the default config.
 *
 * @private
 */
module.exports = () => ({
  chunks: [],
  exclude: [
    // Exclude source maps.
    /\.map$/,
    // Exclude anything starting with manifest and ending .js.
    /^manifest.*\.js?$/,
  ],
  excludeChunks: [],
  importsDirectory: '',
  importScripts: [],
  importWorkboxFrom: 'cdn',
  precacheManifestFilename: 'precache-manifest.[manifestHash].js',
});
