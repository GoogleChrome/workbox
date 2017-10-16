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

/**
 * In wepack jargon: a compilation object represents a single build of versioned
 * `assets`. The `compilation.assets` property of a compilation is a map of
 * filepaths -> asset objects. Each asset object has a property `source()` that
 * returns a string of that asset.
 *
 * `source` and `size` are the only required properties of a webpack asset.
 *
 * @typedef {Object} WebpackAsset
 *
 * @property {Function} source Returns a string representation of the asset that
 *           will be written to the file system (or generated in-memory) by
 *           webpack
 * @property {Function} size Returns the byte size of the asset `source` value
 *
 * @memberof module:workbox-webpack-plugin
 */

/**
 * Creates a webpack asset from a string that can be added to a compilation.
 *
 * Given a string (`asset`) we can return a webpack compilation asset object
 * that can be added to the map of webpack's compilation assets.
 *
 * @function webpackAsset
 * @param {string} asset String representation of the assest that should be
 *        written to the file system by webpack.
 * @return {WebpackAsset}
 *
 * @memberof module:workbox-webpack-plugin
 */
module.exports = (asset) => ({
  source: () => asset,
  size: () => asset.length,
});
