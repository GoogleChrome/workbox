const url = require('url');

const entry = (revision, filePath, publicPath) => ({
  revision,
  url: url.resolve(publicPath, filePath),
});

/**
 * Filter chunks that have one of the provided names (from config.chunks)
 * @param {Array<Object>} chunks Webpack chunks
 * @param {Array<string>} include Chunk names to include
 * @param {Array<string>} exclude Chunk names to exclude
 * @return {Array<Object>} Filtered array of chunks
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
 * @param {Array<Object>} chunks Webpack chunks
 * @return {Object} {filename: hash} map
 */
const mapAssetsToChunkHash = (chunks) =>
  chunks.reduce((assetMap, chunk) =>
      Object.assign(
        assetMap,
        ...chunk.files.map((f) => ({[f]: chunk.renderedHash}))
    ), {});

const generateManifestEntries = (compiler, compilation, config) => {
  const {hash} = compilation; // compilation hash
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
    entry(assetsToChunkHash[filePath] || hash, filePath, publicPath)
  );
};

module.exports = generateManifestEntries;
