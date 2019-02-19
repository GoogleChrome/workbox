/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

/**
 * In webpack jargon: a compilation object represents a build of versioned
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
 *           webpack.
 * @property {Function} size Returns the byte size of the asset `source` value.
 *
 * @private
 */

/**
 * Creates a webpack asset from a string that can be added to a compilation.
 *
 * @param {string} assetAsString String representation of the asset that should
 * be written to the file system by webpack.
 * @return {WebpackAsset}
 *
 * @private
 */
function convertStringToAsset(assetAsString) {
  return {
    source: () => assetAsString,
    size: () => assetAsString.length,
  };
}

module.exports = convertStringToAsset;

