/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {matchPart} = require('webpack/lib/ModuleFilenameHelpers');
const prettyBytes = require('pretty-bytes');

const getAssetHash = require('./get-asset-hash');
const resolveWebpackURL = require('./resolve-webpack-url');

/**
 * For a given asset, checks whether at least one of the conditions matches.
 *
 * @param {Asset} asset The webpack asset in question. This will be passed
 * to any functions that are listed as conditions.
 * @param {Compilation} compilation The webpack compilation. This will be passed
 * to any functions that are listed as conditions.
 * @param {Array<string|RegExp|Function>} conditions
 * @return {boolean} Whether or not at least one condition matches.
 */
function checkConditions(asset, compilation, conditions = []) {
  for (const condition of conditions) {
    if (typeof condition === 'function') {
      if (condition({asset, compilation})) {
        return true;
      }
    } else {
      // See https://github.com/webpack/webpack/blob/bf3e869a423a60581dcb64e215b8d14403e997f2/lib/ModuleFilenameHelpers.js#L151-L159
      if (matchPart(asset.name, condition)) {
        return true;
      }
    }
  }

  // We'll only get here if none of the conditions applied.
  return false;
}

/**
 * Filters the set of assets out, based on the configuration options provided:
 * - chunks and excludeChunks, for chunkName-based criteria.
 * - include and exclude, for more general criteria.
 * - maximumFileSizeToCacheInBytes, for size-based criteria.
 *
 * @param {Compilation} compilation The webpack compilation.
 * @param {Object} config The validated configuration, obtained from the plugin.
 * @return {Set<Asset>} The assets that should be included in the manifest,
 * based on the criteria provided.
 */
function filterAssets(compilation, config) {
  const filteredAssets = new Set();
  const stats = compilation.getStats().toJson();

  // See https://webpack.js.org/api/stats/#asset-objects
  for (const asset of stats.assets) {
    // chunkName based filtering is funky because:
    // - Each asset might belong to one or more chunkNames.
    // - If *any* of those chunk names match our config.excludeChunks,
    //   then we skip that asset.
    // - If the config.chunks is defined *and* there's no match
    //   between at least one of the chunkNames and one entry, then
    //   we skip that assets as well.
    const isExcludedChunk = Array.isArray(config.excludeChunks) &&
      asset.chunkNames.some((chunkName) => {
        return config.excludeChunks.includes(chunkName);
      });
    if (isExcludedChunk) {
      continue;
    }

    const isIncludedChunk = !Array.isArray(config.chunks) ||
      asset.chunkNames.some((chunkName) => {
        return config.chunks.includes(chunkName);
      });
    if (!isIncludedChunk) {
      continue;
    }

    // Next, check asset-level checks via includes/excludes:
    const isExcluded = checkConditions(asset, compilation, config.excludes);
    if (isExcluded) {
      continue;
    }

    // Treat an empty config.includes as an implicit inclusion.
    const isIncluded = !Array.isArray(config.includes) ||
        checkConditions(asset, compilation, config.includes);
    if (!isIncluded) {
      continue;
    }

    if (asset.size > config.maximumFileSizeToCacheInBytes) {
      compilation.warnings.push(`${asset.name} is ${prettyBytes(asset.size)},` +
        `and won't be precached by Workbox. Configure ` +
        `maximumFileSizeToCacheInBytes to change this limit.`);
      continue;
    }

    // If we've gotten this far, then add the asset.
    filteredAssets.add(asset);
  }

  return filteredAssets;
}

module.exports = (compilation, config) => {
  const filteredAssets = filterAssets(compilation, config);

  const {publicPath} = compilation.options.output;
  const manifestEntries = [];

  for (const asset of filteredAssets) {
    const publicURL = resolveWebpackURL(publicPath, asset.name);
    if (config.dontCacheBustURLsMatching &&
        asset.name.match(config.dontCacheBustURLsMatching)) {
      manifestEntries.push({url: publicURL});
    } else {
      manifestEntries.push({
        revision: getAssetHash(compilation.assets[asset.name]),
        url: publicURL,
      });
    }
  }

  // TODO: Manifest transformations.

  return manifestEntries;
};
