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

import {
  cacheNames,
  WorkboxError,
  fetchWrapper,
  cacheWrapper,
  assert,
  logger,
} from 'workbox-core/_private.mjs';
import PrecacheEntry from '../models/PrecacheEntry.mjs';
import PrecachedDetailsModel from '../models/PrecachedDetailsModel.mjs';
import showWarningsIfNeeded from '../utils/showWarningsIfNeeded.mjs';
import openInstallLogGroup from '../utils/openInstallLogGroup.mjs';
import printCleanupDetails from '../utils/printCleanupDetails.mjs';
import cleanRedirect from '../utils/cleanRedirect.mjs';
import '../_version.mjs';

/**
 * Performs efficient precaching of assets.
 *
 * @memberof module:workbox-precaching
 */
class PrecacheController {
  /**
   * Create a new PrecacheController.
   *
   * @param {string} cacheName
   */
  constructor(cacheName) {
    this._cacheName = cacheNames.getPrecacheName(cacheName);
    this._entriesToCacheMap = new Map();
    this._precacheDetailsModel = new PrecachedDetailsModel(this._cacheName);
  }

  /**
   * This method will add items to the precache list, removing duplicates
   * and ensuring the information is valid.
   *
   * @param {Array<Object|string>} entries Array of entries to
   * precache.
   */
  addToCacheList(entries) {
    if (process.env.NODE_ENV !== 'production') {
      assert.isArray(entries, {
        moduleName: 'workbox-precaching',
        className: 'PrecacheController',
        funcName: 'addToCacheList',
        paramName: 'entries',
      });
    }

    entries.map((userEntry) => {
      this._addEntryToCacheList(
        this._parseEntry(userEntry)
      );
    });
  }

  /**
   * This method returns a precache entry.
   *
   * @private
   * @param {string|Object} input
   * @return {PrecacheEntry}
   */
  _parseEntry(input) {
    switch (typeof input) {
      case 'string': {
        if (process.env.NODE_ENV !== 'production') {
          if (input.length === 0) {
            throw new WorkboxError(
              'add-to-cache-list-unexpected-type', {
                entry: input,
              }
            );
          }
        }

        return new PrecacheEntry(input, input, input);
      }
      case 'object': {
        if (process.env.NODE_ENV !== 'production') {
          if (!input || !input.url) {
            throw new WorkboxError(
              'add-to-cache-list-unexpected-type', {
                entry: input,
              }
            );
          }
        }

        return new PrecacheEntry(
          input, input.url, input.revision || input.url, !!input.revision);
      }
      default:
        throw new WorkboxError('add-to-cache-list-unexpected-type', {
          entry: input,
        });
    }
  }

  /**
   * Adds an entry to the precache list, accounting for possible duplicates.
   *
   * @private
   * @param {PrecacheEntry} entryToAdd
   */
  _addEntryToCacheList(entryToAdd) {
    // Check if the entry is already part of the map
    const existingEntry = this._entriesToCacheMap.get(entryToAdd._entryId);
    if (!existingEntry) {
      this._entriesToCacheMap.set(entryToAdd._entryId, entryToAdd);
      return;
    }

    // Duplicates are fine, but make sure the revision information
    // is the same.
    if (existingEntry._revision !== entryToAdd._revision) {
      throw new WorkboxError('add-to-cache-list-conflicting-entries', {
        firstEntry: existingEntry._originalInput,
        secondEntry: entryToAdd._originalInput,
      });
    }
  }

  /**
   * Call this method from a service work install event to start
   * precaching assets.
   *
   * @param {Object} options
   * @param {boolean} options.suppressWarnings Suppress warning messages.
   * @return {Promise<Object>}
   */
  async install(options = {}) {
    if (process.env.NODE_ENV !== 'production') {
      if (options.suppressWarnings !== true) {
        showWarningsIfNeeded(this._entriesToCacheMap);
      }
    }

    const entriesToPrecache = [];
    const entriesAlreadyPrecached = [];

    for (const precacheEntry of this._entriesToCacheMap.values()) {
      if (await this._precacheDetailsModel._isEntryCached(precacheEntry)) {
        entriesAlreadyPrecached.push(precacheEntry);
      } else {
        entriesToPrecache.push(precacheEntry);
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      openInstallLogGroup(entriesToPrecache, entriesAlreadyPrecached);
    }

    // Wait for all requests to be cached.
    await Promise.all(entriesToPrecache.map((precacheEntry) => {
      return this._cacheEntry(precacheEntry);
    }));

    if (process.env.NODE_ENV !== 'production') {
      logger.groupEnd();
    }

    return {
      updatedEntries: entriesToPrecache,
      notUpdatedEntries: entriesAlreadyPrecached,
    };
  }

  /**
   * Requests the entry and saves it to the cache if the response
   * is valid.
   *
   * @private
   * @param {BaseCacheEntry} precacheEntry The entry to fetch and cache.
   * @return {Promise<boolean>} Returns a promise that resolves once the entry
   * has been fetched and cached or skipped if no update is needed. The
   * promise resolves with true if the entry was cached / updated and
   * false if the entry is already cached and up-to-date.
   */
  async _cacheEntry(precacheEntry) {
    let response = await fetchWrapper.fetch(
      precacheEntry._networkRequest,
    );

    if (response.redirected) {
      response = await cleanRedirect(response);
    }

    await cacheWrapper.put(this._cacheName,
      precacheEntry._cacheRequest, response);

    await this._precacheDetailsModel._addEntry(precacheEntry);

    return true;
  }

  /**
   * Compare the URLs and determines which assets are no longer required
   * in the cache.
   *
   * This should be called in the service worker activate event.
   *
   * @return {Promise<Object>} Resolves with an object containing details
   * of the deleted cache requests and precache revision details.
   */
  async cleanup() {
    const expectedCacheUrls = [];
    this._entriesToCacheMap.forEach((entry) => {
      expectedCacheUrls.push(entry._cacheRequest.url);
    });

    const [deletedCacheRequests, deletedRevisionDetails] = await Promise.all([
      this._cleanupCache(expectedCacheUrls),
      this._cleanupDetailsModel(expectedCacheUrls),
    ]);

    if (process.env.NODE_ENV !== 'production') {
      printCleanupDetails(deletedCacheRequests, deletedRevisionDetails);
    }

    return {
      deletedCacheRequests,
      deletedRevisionDetails,
    };
  }

  /**
   * Goes through all the cache entries and removes any that are
   * outdated.
   *
   * @private
   * @param {Array<string>} expectedCacheUrls Array of URLs that are
   * expected to be cached.
   * @return {Promise<Array<string>>} Resolves to an array of URLs
   * of cached requests that were deleted.
   */
  async _cleanupCache(expectedCacheUrls) {
    if (!await caches.has(this._cacheName)) {
      // Cache doesn't exist, so nothing to delete
      return [];
    }

    const cache = await caches.open(this._cacheName);
    const cachedRequests = await cache.keys();
    const cacheURLsToDelete = cachedRequests.filter((cachedRequest) => {
      return !expectedCacheUrls.includes(cachedRequest.url);
    });

    await Promise.all(
      cacheURLsToDelete.map((cacheUrl) => cache.delete(cacheUrl))
    );

    return cacheURLsToDelete;
  }

  /**
   * Goes through all entries in indexedDB and removes any that are outdated.
   *
   * @private
   * @param {Array<string>} expectedCacheUrls Array of URLs that are
   * expected to be cached.
   * @return {Promise<Array<string>>} Resolves to an array of URLs removed
   * from indexedDB.
   */
  async _cleanupDetailsModel(expectedCacheUrls) {
    const revisionedEntries = await this._precacheDetailsModel._getAllEntries();
    const allDetailUrls = Object.keys(revisionedEntries);

    const detailsToDelete = allDetailUrls.filter((detailsUrl) => {
      const fullUrl = new URL(detailsUrl, location).toString();
      return !expectedCacheUrls.includes(fullUrl);
    });

    await Promise.all(
      detailsToDelete.map(
        (detailsId) => this._precacheDetailsModel._deleteEntry(detailsId)
      )
    );

    return detailsToDelete.map((detailsId) => {
      return {
        id: detailsId,
        value: revisionedEntries[detailsId],
      };
    });
  }

  /**
   * Returns an array of fully qualified URL's that will be precached.
   *
   * @return {Array<string>} An array of URLs.
   */
  getCachedUrls() {
    return Array.from(this._entriesToCacheMap.keys())
    .map((url) => new URL(url, location).href);
  }
}

export default PrecacheController;
