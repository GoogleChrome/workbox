'use strict';

const constants = require('../constants');
const errors = require('../errors');
const logHelper = require('../log-helper');
const modifyUrlPrefixTranform = require('./modify-url-prefix-transform');
const noRevisionForUrlsMatchingTransform =
  require('./no-revision-for-urls-matching-transform');

/**
 * A `ManifestTransform` function can be used to modify the modify the `url` or
 * `revision` properties of some or all of the
 * {@link module:workbox-build#ManifestEntry|ManifestEntries} in the manifest.
 *
 * Deleting the `revision` property of an entry will cause
 * the corresponding `url` to be precached without cache-busting parameters
 * applied, which is to say, it implies that the URL itself contains
 * proper versioning info. If the `revision` property is present, it must be
 * set to a string.
 *
 * @example <caption>A transformation that prepended the origin of a CDN for any
 * URL starting with '/assets/' could be implemented as:</caption>
 *
 * const cdnTransform = (manifestEntries) => manifestEntries.map(entry => {
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
 * const removeRevisionTransform = (manifestEntries) => {
 *   return manifestEntries.map(entry => {
 *     const hashRegExp = /\.\w{8}\./;
 *     if (entry.url.match(hashRegExp)) {
 *       delete entry.revision;
 *     }
 *     return entry;
 *   });
 * };
 *
 * @callback ManifestTransform
 * @param {Array<ManifestEntry>} manifestEntries The full array of entries,
 * prior to the current transformation.
 * @return {Array<ManifestEntry>} The array of entries with the transformation
 * applied.
 * @memberof module:workbox-build
 */

module.exports = (fileDetails, options) => {
  const maximumFileSize = options.maximumFileSizeToCacheInBytes ||
    constants.maximumFileSize;
  const filteredFileDetails = fileDetails.filter((fileDetails) => {
    // Remove oversized files.
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
      url: fileDetails.file.replace(/\\/g, '/'),
      revision: fileDetails.hash,
    };
  });

  let manifestTransforms = [];

  if (options.modifyUrlPrefix) {
    manifestTransforms.push(modifyUrlPrefixTranform(options.modifyUrlPrefix));
  }

  if (options.dontCacheBustUrlsMatching) {
    manifestTransforms.push(
      noRevisionForUrlsMatchingTransform(options.dontCacheBustUrlsMatching));
  }

  if (options.manifestTransforms) {
    if (Array.isArray(options.manifestTransforms)) {
      manifestTransforms = manifestTransforms.concat(
        options.manifestTransforms
      );
    } else {
      throw new Error(errors['bad-manifest-transforms']);
    }
  }

  // Apply the transformations sequentially, and return the result.
  return manifestTransforms.reduce(
    (previousManifest, transform) => transform(previousManifest),
    normalizedManifest);
};
