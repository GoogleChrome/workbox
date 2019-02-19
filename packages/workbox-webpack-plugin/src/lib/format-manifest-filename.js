/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

/**
 * Looks for a placeholder string in originalFilename, and replaces it with a
 * value provided.
 *
 * @param {string} originalFilename
 * @param {string} manifestHash
 * @return {string}
 *
 * @private
 */
module.exports = (originalFilename, manifestHash) => {
  const manifestHashPlaceholder = '[manifestHash]';
  const replacedFilename = originalFilename.replace(
      manifestHashPlaceholder, manifestHash);

  if (replacedFilename === originalFilename) {
    throw new Error(`Your configured precacheManifestFilename option, ` +
      `'${originalFilename}', must contain the placeholder string ` +
      `'${manifestHashPlaceholder}' somewhere. For example, ` +
      `'precache-manifest.${manifestHashPlaceholder}.js'`);
  }

  return replacedFilename;
};
