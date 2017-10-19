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
 * A single manifest entry that workbox-sw can precache
 *
 * @param {string} url Webpack asset url path
 * @param {string} [revision] A revision hash for the entry
 * @return {module:workbox-build.ManifestEntry} A single manifest entry
 *
 * @private
 */
const entry = (url, revision) => (revision
  ? {url, revision}
  : {url}
);

/**
 * Filter chunks that have one of the provided names (from config.chunks)
 *
 * TODO:
 *  Filter files by size:
 *    https://github.com/GoogleChrome/workbox/pull/808#discussion_r139606242
 *  Filter files that match `staticFileGlobsIgnorePatterns` (or something)
 *  but filter for [/\.map$/, /asset-manifest\.json$/] by default:
 *    https://github.com/GoogleChrome/workbox/pull/808#discussion_r140565156
 *
 * @param {Array<Object>} chunks Webpack chunks
 * @param {Array<string>} include Chunk names to include
 * @param {Array<string>} exclude Chunk names to exclude
 * @return {Array<Object>} Filtered array of chunks
 *
 * @private
 */
const filterChunks = (chunks, include, exclude) =>
  chunks.filter((chunk) =>
    // chunk has a name
    Object.prototype.hasOwnProperty.call(chunk, 'name')
      // did not specify include or chunk in include
      && (!Array.isArray(include) || !!~include.indexOf(chunk.name))
      // did not specify exclude or chunk not in exclude
      && (!Array.isArray(exclude) || !~exclude.indexOf(chunk.name))
  );

/**
 * Maps webpack asset filenames to their chunk hash
 *
 * TODO:
 *   Elaborate on this function description:
 *      https://github.com/GoogleChrome/workbox/pull/808#discussion_r139605066
 *
 * @param {Array<Object>} chunks Webpack chunks
 * @return {Object} {filename: hash} map
 *
 * @private
 */
const mapAssetsToChunkHash = (chunks) =>
  chunks.reduce((assetMap, chunk) =>
      Object.assign(
        assetMap,
        ...chunk.files.map((f) => ({[f]: chunk.renderedHash}))
    ), {});

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
 * @param {Object} compiler Webpack compiler
 * @param {Object} compilation Webpack compilation
 * @param {module:workbox-webpack-plugin.Configuration} config
 * @return {Array<module:workbox-build.ManifestEntry>}
 *
 * @memberof module:workbox-webpack-plugin
 */
module.exports = (compiler, compilation, config) => {
  const {publicPath} = compilation.options.output;

  // Array<string> | undefined
  const includeNames = config.chunks;
  const excludeNames = config.excludeChunks;

  // Array<{files: Array<(filename: string)>, name?: string}>
  let {chunks} = compilation;

  if (includeNames || excludeNames) {
    // Only include chunks in config.chunks and
    // exclude any chunks in config.excludeChunks
    chunks = filterChunks(chunks, includeNames, excludeNames);
  }

  // Use chunkhash to save a chunk hash to each filename in chunks
  const assetsToChunkHash = mapAssetsToChunkHash(chunks);

  /**
   * Files that will be used to generate the manifest entries
   *
   * If config.chunks is specifed, we only use files that belong to named chunks
   * otherwise we use all of webpack's compilation.assets
   *
   * @type {Array<string>}
   */
  const manifestFiles = includeNames
    ? Object.keys(assetsToChunkHash)
    : Object.keys(compilation.assets);

  // create and return the manifest entries
  return manifestFiles.map((filePath) =>
    // use chunkhash if available, otherwise use compilation hash
    entry(
      resolveWebpackUrl(publicPath, filePath),
      assetsToChunkHash[filePath] || compilation.hash
    )
  );
};
