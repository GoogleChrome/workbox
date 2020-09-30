/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {matchPart} = require('webpack').ModuleFilenameHelpers;
const transformManifest = require('workbox-build/build/lib/transform-manifest');

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
 * @private
 */
function checkConditions(asset, compilation, conditions = []) {
  for (const condition of conditions) {
    if (typeof condition === 'function') {
      if (condition({asset, compilation})) {
        return true;
      }
    } else {
      if (matchPart(asset.name, condition)) {
        return true;
      }
    }
  }

  // We'll only get here if none of the conditions applied.
  return false;
}

/**
 * Creates a mapping of an asset name to an Set of zero or more chunk names
 * that the asset is associated with.
 *
 * Those chunk names come from a combination of the `chunkName` property on the
 * asset, as well as the `stats.namedChunkGroups` property. That is the only
 * way to find out if an asset has an implicit descendent relationship with a
 * chunk, if it was, e.g., created by `SplitChunksPlugin`.
 *
 * See https://github.com/GoogleChrome/workbox/issues/1859
 * See https://github.com/webpack/webpack/issues/7073
 *
 * @param {Object} stats The webpack compilation stats.
 * @return {object<string, Set<string>>}
 * @private
 */
function assetToChunkNameMapping(assets, chunkGroups) {
  const mapping = {};

  for (const asset of assets) {
    mapping[asset.name] = new Set(asset.chunkNames);
  }

  for (const [chunkName, {assets}] of Object.entries(stats.namedChunkGroups)) {
    for (const assetName of assets) {
      // See https://github.com/GoogleChrome/workbox/issues/2194
      if (mapping[assetName]) {
        mapping[assetName].add(chunkName);
      }
    }
  }

  return mapping;
}

/**
 * Filters the set of assets out, based on the configuration options provided:
 * - chunks and excludeChunks, for chunkName-based criteria.
 * - include and exclude, for more general criteria.
 *
 * @param {Compilation} compilation The webpack compilation.
 * @param {Object} config The validated configuration, obtained from the plugin.
 * @return {Set<Asset>} The assets that should be included in the manifest,
 * based on the criteria provided.
 * @private
 */
function filterAssets(compilation, config) {
  const filteredAssets = new Set();
  const assets = compilation.getAssets();
  // const assetNameToChunkNames = assetToChunkNameMapping(assets,
  //     compilation.chunkGroups);

  const allowedAssets = new Set();
  const deniedAssets = new Set();
  // See https://github.com/GoogleChrome/workbox/issues/1287
  if (Array.isArray(config.chunks)) {
    for (const chunkName of config.chunks) {
      const namedChunkGroup = compilation.namedChunkGroups.get(chunkName);
      if (namedChunkGroup) {
        const allowed
      } else {
        compilation.warnings.push(`The chunk '${namedChunkGroup}' was ` +
          `provided in your Workbox chunks config, but was not found in the ` +
          `compilation.`);
      }
    }
  }

  for (const asset of assets) {
    // chunkName based filtering is funky because:
    // - Each asset might belong to one or more chunkNames.
    // - If *any* of those chunk names match our config.excludeChunks,
    //   then we skip that asset.
    // - If the config.chunks is defined *and* there's no match
    //   between at least one of the chunkNames and one entry, then
    //   we skip that assets as well.
    // const isExcludedChunk = Array.isArray(config.excludeChunks) &&
    //   config.excludeChunks.some((chunkName) => {
    //     return assetNameToChunkNames[asset.name].has(chunkName);
    //   });
    // if (isExcludedChunk) {
    //   continue;
    // }

    const isIncludedChunk = !Array.isArray(config.chunks) ||
      config.chunks.some((chunkName) => {
        return assetNameToChunkNames[asset.name].has(chunkName);
      });
    if (!isIncludedChunk) {
      continue;
    }

    // Next, check asset-level checks via includes/excludes:
    const isExcluded = checkConditions(asset, compilation, config.exclude);
    if (isExcluded) {
      continue;
    }

    // Treat an empty config.includes as an implicit inclusion.
    const isIncluded = !Array.isArray(config.include) ||
        checkConditions(asset, compilation, config.include);
    if (!isIncluded) {
      continue;
    }

    // If we've gotten this far, then add the asset.
    filteredAssets.add(asset);
  }

  return filteredAssets;
}

module.exports = async (compilation, config) => {
  const filteredAssets = filterAssets(compilation, config);

  const {publicPath} = compilation.options.output;

  const fileDetails = Array.from(filteredAssets).map((asset) => {
    return {
      file: resolveWebpackURL(publicPath, asset.name),
      hash: getAssetHash(asset),
      size: asset.source.size() || 0,
    };
  });

  const {manifestEntries, size, warnings} = await transformManifest({
    fileDetails,
    additionalManifestEntries: config.additionalManifestEntries,
    dontCacheBustURLsMatching: config.dontCacheBustURLsMatching,
    manifestTransforms: config.manifestTransforms,
    maximumFileSizeToCacheInBytes: config.maximumFileSizeToCacheInBytes,
    modifyURLPrefix: config.modifyURLPrefix,
    transformParam: compilation,
  });

  compilation.warnings = compilation.warnings.concat(warnings || []);

  // Ensure that the entries are properly sorted by URL.
  const sortedEntries = manifestEntries.sort(
      (a, b) => a.url === b.url ? 0 : (a.url > b.url ? 1 : -1));

  return {size, sortedEntries};
};
