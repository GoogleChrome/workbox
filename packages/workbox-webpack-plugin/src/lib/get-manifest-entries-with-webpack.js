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

const resolveWebpackUrl = require('./utils/resolve-webpack-url');

/**
 * A single manifest entry that workbox-sw can precache.
 *
 * @param {string} url webpack asset url path
 * @param {string} [revision] A revision hash for the entry
 * @return {module:workbox-build.ManifestEntry} A single manifest entry
 *
 * @private
 */
function getEntry(url, revision) {
  return revision ? {url, revision} : {url};
}

/**
 * Filter to narrow down the asset list to chunks that:
 * - have a name.
 * - if there's a whitelist, the chunk's name is in the whitelist.
 * - if there's a blacklist, the chunk's name is not in the blacklist.
 *
 * TODO:
 *  Filter files by size:
 *    https://github.com/GoogleChrome/workbox/pull/808#discussion_r139606242
 *  Filter files that match `staticFileGlobsIgnorePatterns` (or something)
 *  but filter for [/\.map$/, /asset-manifest\.json$/] by default:
 *    https://github.com/GoogleChrome/workbox/pull/808#discussion_r140565156
 *
 * @param {Array<Object>} chunks webpack chunks.
 * @param {Array<string>} [whitelist] Chunk names to include.
 * @param {Array<string>} [blacklist] Chunk names to exclude.
 * @return {Array<Object>} Filtered array of chunks.
 *
 * @private
 */
function filterChunks(chunks, whitelist, blacklist) {
  return chunks.filter((chunk) => {
    return 'name' in chunk &&
      (!whitelist || whitelist.includes(chunk.name)) &&
      (!blacklist || !blacklist.includes(chunk.name));
  });
}

/**
 * Maps webpack asset filenames to their chunk hash.
 *
 * TODO:
 *   Elaborate on this function description:
 *      https://github.com/GoogleChrome/workbox/pull/808#discussion_r139605066
 *
 * @param {Array<Object>} chunks webpack chunks
 * @return {Object} {filename: hash} map
 *
 * @private
 */
function mapAssetsToChunkHash(chunks) {
  return chunks.reduce((assetMap, chunk) => {
    return Object.assign(
      assetMap,
      ...chunk.files.map((f) => ({[f]: chunk.renderedHash}))
    );
  }, {});
}

/**
 * Generate an array of manifest entries using webpack's compilation data
 *
 * TODO:
 *   Rename variables so they are easier to understand:
 *      https://github.com/GoogleChrome/workbox/pull/808#discussion_r139605624
 *      https://github.com/GoogleChrome/workbox/pull/808#discussion_r139605973
 *   If an asset is already using some kind of build hash, do not use the
 *   revision parameter in `entry()`:
 *      https://github.com/GoogleChrome/workbox/pull/808#discussion_r140584483
 *
 * @function getManifestEntriesWithWebpack
 * @param {Object} compiler webpack compiler
 * @param {Object} compilation webpack compilation
 * @param {module:workbox-webpack-plugin.Configuration} config
 * @return {Array<module:workbox-build.ManifestEntry>}
 *
 * @memberof module:workbox-webpack-plugin
 */
module.exports = (compiler, compilation, config) => {
  const {publicPath} = compilation.options.output;

  // Array<string> | undefined
  const whitelist = config.chunks;
  const blacklist = config.excludeChunks;

  // Array<{files: Array<(filename: string)>, name?: string}>
  let {chunks} = compilation;

  if (whitelist || blacklist) {
    // Only include chunks in config.chunks and
    // exclude any chunks in config.excludeChunks
    chunks = filterChunks(chunks, whitelist, blacklist);
  }

  // Use chunkhash to save a chunk hash to each filename in chunks
  const assetsToChunkHash = mapAssetsToChunkHash(chunks);

  /**
   * Files that will be used to generate the manifest entries
   *
   * If config.chunks is specifed, we only use files that belong to named chunks
   * otherwise we use all of webpack's compilation.assets.
   *
   * @type {Array<string>}
   */
  const manifestFiles = whitelist
    ? Object.keys(assetsToChunkHash)
    : Object.keys(compilation.assets);

  // Create and return the manifest entries.
  return manifestFiles.map((filePath) => {
    return getEntry(resolveWebpackUrl(publicPath, filePath),
      // Use chunkhash if available, otherwise use compilation hash.
      assetsToChunkHash[filePath] || compilation.hash);
  });
};
