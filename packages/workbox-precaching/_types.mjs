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

import './_version.mjs';

/**
 * @typedef {Object} InstallResult
 * @property {
 * Array<module:workbox-precaching.PrecacheController.PrecacheEntry|string>
 * } updatedEntries List of entries
 * supplied for precaching that were precached.
 * @property {
 * Array<module:workbox-precaching.PrecacheController.PrecacheEntry|string>
 * } notUpdatedEntries List of entries
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
