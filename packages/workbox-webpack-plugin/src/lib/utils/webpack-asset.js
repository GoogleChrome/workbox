/**
 * Creates a webpack asset from a string that can be added to a compilation
 * @param {string} asset
 * @return {Object} webpack asset
 */
const webpackAsset = (asset) => ({
  source: () => asset,
  size: () => asset.length,
});

module.exports = webpackAsset;
