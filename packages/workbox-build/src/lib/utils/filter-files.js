const constants = require('../constants');
const logHelper = require('../log-helper');
const modifyUrlPrefixTranform = require('./modify-url-prefix-transform');
const noRevisionForUrlsMatchingTransform =
  require('./no-revision-for-urls-matching-transform');
const path = require('path');

/**
 * A `ManifestTransform` function can be used to modify the modify the `url` or
 * `revision` properties of some or all of the
 * {@link module:workbox-build#ManifestEntry|ManifestEntries} in the manifest.
 *
 * Setting the `revision` property of an entry to a "falsey" value will cause
 * the corresponding `url` to be precached without cache-busting parameters
 * applied, which is to say, it implies that the URL itself contains
 * proper versioning info.
 *
 * @example <caption>A transformation that prepended the origin of a CDN for any
 * URL starting with '/assets/' could be implemented as:</caption>
 *
 * const cdnTransform = (manifest) => manifest.map(entry => {
 *   const cdnOrigin = 'https://example.com';
 *   if (entry.url.startsWith('/assets/')) {
 *     entry.url = cdnOrigin + entry.url;
 *   }
 *   return entry;
 * });
 *
 * @example <caption>A transformation that removes the revision field when the
 * URL contains an 8-character hash surrounded by '.', indicating that it
 * already contains revision information:</caption>
 *
 * const removeRevisionTransform = (manifest) => manifest.map(entry => {
 *   const hashRegExp = /\.\w{8}\./;
 *   if (entry.url.match(hashRegExp)) {
 *     delete entry.revision;
 *   }
 *   return entry;
 * });
 *
 * @callback ManifestTransform
 * @param {Array<ManifestEntry>} manifest The manifest, prior to the current
 * transformation.
 * @return {Array<ManifestEntry>} The manifest with the transformation applied.
 * @memberof module:workbox-build
 */

module.exports = (fileDetails, options) => {
  const maximumFileSize = options.maximumFileSizeToCacheInBytes ||
    constants.maximumFileSize;
  const filteredFileDetails = fileDetails.filter((fileDetails) => {
    // Remove oversize files.
    if (fileDetails.size > maximumFileSize) {
      logHelper.warn(`Skipping file '${fileDetails.file}' due to size. ` +
        `[Max size supported is ${maximumFileSize}, this file is ` +
        `${fileDetails.size}]`);
      return false;
    }

    return true;
  });

  // Take the array of fileDetail objects and convert it into an array of
  // {url, revision} objects, with path.sep replaced with /.
  const normalizedManifest = filteredFileDetails.map((fileDetails) => {
    return {
      url: fileDetails.file.replace(path.sep, '/'),
      revision: fileDetails.hash,
    };
  });

  const manifestTransforms = options.manifestTransforms || [];

  if (options.modifyUrlPrefix) {
    manifestTransforms.push(modifyUrlPrefixTranform(options.modifyUrlPrefix));
  }

  if (options.dontCacheBustUrlsMatching) {
    manifestTransforms.push(
      noRevisionForUrlsMatchingTransform(options.dontCacheBustUrlsMatching));
  }

  // Apply the transformations sequentially, and return the result.
  return manifestTransforms.reduce(
    (previousManifest, transform) => transform(previousManifest),
    normalizedManifest);
};
