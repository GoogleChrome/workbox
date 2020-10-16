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
 * Returns the names of all the assets in a chunk group.
 *
 * @param {ChunkGroup} chunkGroup
 * @return {Array<Asset>}
 * @private
 */
function getNamesOfAssetsInChunkGroup(chunkGroup) {
  const assetNames = [];
  for (const chunk of chunkGroup.chunks) {
    assetNames.splice(0, 0, ...chunk.files);
    // This only appears to be set in webpack v5.
    if (chunk.auxiliaryFiles) {
      assetNames.splice(0, 0, ...chunk.auxiliaryFiles);
    }
  }
  return assetNames;
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

  const allowedAssetNames = new Set();
  // See https://github.com/GoogleChrome/workbox/issues/1287
  if (Array.isArray(config.chunks)) {
    for (const chunkName of config.chunks) {
      const namedChunkGroup = compilation.namedChunkGroups.get(chunkName);
      if (namedChunkGroup) {
        for (const assetName of getNamesOfAssetsInChunkGroup(namedChunkGroup)) {
          allowedAssetNames.add(assetName);
        }
      } else {
        compilation.warnings.push(`The chunk '${chunkName}' was ` +
          `provided in your Workbox chunks config, but was not found in the ` +
          `compilation.`);
      }
    }
  }

  const deniedAssetNames = new Set();
  if (Array.isArray(config.excludeChunks)) {
    for (const chunkName of config.excludeChunks) {
      const namedChunkGroup = compilation.namedChunkGroups.get(chunkName);
      if (namedChunkGroup) {
        for (const assetName of getNamesOfAssetsInChunkGroup(namedChunkGroup)) {
          deniedAssetNames.add(assetName);
        }
      } // Don't warn if the chunk group isn't found.
    }
  }

  for (const asset of assets) {
    // chunk based filtering is funky because:
    // - Each asset might belong to one or more chunks.
    // - If *any* of those chunk names match our config.excludeChunks,
    //   then we skip that asset.
    // - If the config.chunks is defined *and* there's no match
    //   between at least one of the chunkNames and one entry, then
    //   we skip that assets as well.

    if (deniedAssetNames.has(asset.name)) {
      continue;
    }

    if (Array.isArray(config.chunks) && !allowedAssetNames.has(asset.name)) {
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
