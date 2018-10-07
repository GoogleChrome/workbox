/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import './_version.mjs';

/**
 * @typedef {Object} InstallResult
 * @property {
 * Array<workbox.precaching.PrecacheEntry|string>
 * } updatedEntries List of entries
 * supplied for precaching that were precached.
 * @property {Array<workbox.precaching.PrecacheEntry|string>}
 * notUpdatedEntries List of entries
 * supplied for precaching that were already precached.
 *
 * @memberof workbox.precaching
 */

/**
 * @typedef {Object} CleanupResult
 * @property {Array<string>} deletedCacheRequests List of URLs that were
 * deleted from the precache cache.
 * @property {Array<string>} deletedRevisionDetails
 * List of URLs that were deleted from the precache cache.
 *
 * @memberof workbox.precaching
 */

/**
 * @typedef {Object} PrecacheEntry
 * @property {string} url URL to precache.
 * @property {string} revision Revision information for the URL.
 *
 * @memberof workbox.precaching
 */

/**
 * The "urlManipulation" callback can be used to determine if there are any
 * additional permutations of a URL that should be used to check against
 * the available precached files.
 *
 * For example, Workbox supports checking for '/index.html' when the URL
 * '/' is provided. This callback allows additional, custom checks.
 *
 * @callback ~urlManipulation
 * @param {Object} context
 * @param {URL} context.url The request's URL.
 * @return {Array<URL>} To add additional urls to test, return an Array of
 * URL's. Please note that these **should not be Strings**, but URL objects.
 *
 * @memberof workbox.precaching
 */
