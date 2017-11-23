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

const getAssetHash = require('./utils/get-asset-hash');
const resolveWebpackUrl = require('./utils/resolve-webpack-url');

/**
 * A single manifest entry that Workbox can precache.
 * When possible, we leave out the revision information, which tells Workbox
 * that the URL contains enough info to uniquely version the asset.
 *
 * @param {Array<string>} knownHashes All of the hashes that are associated
 * with this webpack build.
 * @param {string} url webpack asset url path
 * @param {string} [revision] A revision hash for the entry
 * @return {module:workbox-build.ManifestEntry} A single manifest entry
 *
 * @private
 */
function getEntry(knownHashes, url, revision) {
  // We're assuming that if the URL contains any of the known hashes
  // (either the short or full chunk hash or compilation hash) then it's
  // already revisioned, and we don't need additional out-of-band revisioning.
  if (!revision || knownHashes.some((hash) => url.includes(hash))) {
    return {url};
  }
  return {revision, url};
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
 * Takes in a list of webpack chunks, and returns a mapping of the path for each
 * file in the chunk to the associated hash for the entire chunk.
 *
 * @param {Array<Object>} chunks The webpack chunks.
 * @return {Object<string, string>} Mapping of paths to hashes.
 *
 * @private
 */
function mapChunksToChunkHashes(chunks) {
  const mapping = {};
  for (const chunk of chunks) {
    for (const file of chunk.files) {
      mapping[file] = chunk.renderedHash;
    }
  }
  return mapping;
}

/**
 * Generate an array of manifest entries using webpack's compilation data
 *
 * TODO:
 *   Rename variables so they are easier to understand:
 *      https://github.com/GoogleChrome/workbox/pull/808#discussion_r139605624
 *      https://github.com/GoogleChrome/workbox/pull/808#discussion_r139605973
 *
 * @function getManifestEntriesWithWebpack
 * @param {Object} compilation webpack compilation
 * @param {module:workbox-webpack-plugin.Configuration} config
 * @return {Array<module:workbox-build.ManifestEntry>}
 *
 * @private
 */
module.exports = (compilation, config) => {
  const {publicPath} = compilation.options.output;
  const whitelistedChunkNames = config.chunks;
  const blacklistedChunkNames = config.excludeChunks;
  let {
    assets,
    chunks,
  } = compilation;

  // If specified, only include chunks in config.chunks and exclude any chunks
  // named in config.excludeChunks.
  if (whitelistedChunkNames || blacklistedChunkNames) {
    chunks = filterChunks(chunks, whitelistedChunkNames, blacklistedChunkNames);
  }

  // Map all of the paths from the named chunks to their associated hashes.
  const pathsToHashes = mapChunksToChunkHashes(chunks);

  // If we're not in whitelist mode, then also include the paths we can infer
  // from compilation.assets in the final output.
  if (!whitelistedChunkNames) {
    for (const [filePath, asset] of Object.entries(assets)) {
      // If we already have a hash because this filePath was part of a chunk's
      // files, then we can skip calculating a hash.
      if (!(filePath in pathsToHashes)) {
        pathsToHashes[filePath] = getAssetHash(asset);
      }
    }
  }

  let knownHashes = [compilation.hash, compilation.fullHash];
  for (const chunk of compilation.chunks) {
    knownHashes.push(chunk.hash, chunk.renderedHash);
  }
  // Make sure we don't have any empty/undefined hashes.
  knownHashes = knownHashes.filter((hash) => !!hash);

  const manifestEntries = [];
  for (const [filePath, hash] of Object.entries(pathsToHashes)) {
    const publicUrl = resolveWebpackUrl(publicPath, filePath);
    const manifestEntry = getEntry(knownHashes, publicUrl, hash);
    manifestEntries.push(manifestEntry);
  }
  return manifestEntries;
};
