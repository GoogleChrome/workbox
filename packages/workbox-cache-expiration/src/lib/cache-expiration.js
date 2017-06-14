/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

import idb from 'idb';
import {isType, isInstance, isArrayOfType} from '../../../../lib/assert';
import logHelper from '../../../../lib/log-helper';
import {
  idbName,
  idbVersion,
  urlPropertyName,
  timestampPropertyName,
} from './constants';
import ErrorFactory from './error-factory';

/**
 * The `CacheExpiration` class allows you define an expiration and / or
 * limit on the responses cached.
 *
 * @example
 * const cacheExpiration = new workbox.cacheExpiration.CacheExpiration({
 *   maxEntries: 2,
 *   maxAgeSeconds: 10,
 * });
 *
 * @memberof module:workbox-cache-expiration
 */
class CacheExpiration {
  /**
   * Creates a new `CacheExpiration` instance, which is used to remove entries
   * from a [`Cache`](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
   * once certain criteria—max number of entries, age of entry, or both—is met.
   *
   * @param {Object} input
   * @param {Number} [input.maxEntries] The maximum number of entries to cache.
   * Entries will be expired using a least recently used (LRU) policy once
   * the cache reaches this threshold.
   * @param {Number} [input.maxAgeSeconds] The maximum age of an entry before
   * it's treated as staled and removed.
   */
  constructor({maxEntries, maxAgeSeconds} = {}) {
    if (!(maxEntries || maxAgeSeconds)) {
      throw ErrorFactory.createError('max-entries-or-age-required');
    }

    if (maxEntries && typeof maxEntries !== 'number') {
      throw ErrorFactory.createError('max-entries-must-be-number');
    }

    if (maxAgeSeconds && typeof maxAgeSeconds !== 'number') {
      throw ErrorFactory.createError('max-age-seconds-must-be-number');
    }

    this.maxEntries = maxEntries;
    this.maxAgeSeconds = maxAgeSeconds;

    // These are used to keep track of open IndexDB and Caches for a given name.
    this._dbs = new Map();
    this._caches = new Map();

    // This is used to ensure there's one asynchronous expiration operation
    // running at a time.
    this._expirationMutex = false;
    // If another expiration request comes in, the timestamp is saved here and
    // re-run after.
    this._timestampForNextRun = null;
  }

  /**
   * Returns a promise for the IndexedDB database used to keep track of state.
   *
   * @private
   * @param {Object} input
   * @param {string} input.cacheName Name of the cache the Responses belong to.
   * @return {DB} An open DB instance.
   */
  async getDB({cacheName} = {}) {
    isType({cacheName}, 'string');

    const idbId = `${idbName}-${cacheName}`;
    if (!this._dbs.has(idbId)) {
      const openDb = await idb.open(idbId, idbVersion, (upgradeDB) => {
        const objectStore = upgradeDB.createObjectStore(cacheName,
          {keyPath: urlPropertyName});
        objectStore.createIndex(timestampPropertyName, timestampPropertyName,
          {unique: false});
      });
      this._dbs.set(idbId, openDb);
    }

    return this._dbs.get(idbId);
  }

  /**
   * Returns a promise for an open Cache instance named `cacheName`.
   *
   * @private
   * @param {Object} input
   * @param {string} input.cacheName Name of the cache the Responses belong to.
   * @return {Cache} An open Cache instance.
   */
  async getCache({cacheName} = {}) {
    isType({cacheName}, 'string');

    if (!this._caches.has(cacheName)) {
      const openCache = await caches.open(cacheName);
      this._caches.set(cacheName, openCache);
    }

    return this._caches.get(cacheName);
  }

  /**
   * Checks whether a `Response` is "fresh", based on the `Response's`
   * `Date` header and the `maxAgeSeconds` parameter passed into the
   * constructor.
   *
   * If `maxAgeSeconds` or the `Date` header is not set then it will
   * default to returning `true`, i.e. the response is still fresh and should
   * be used.
   *
   * @param {Object} input
   * @param {Response} input.cachedResponse The `Response` object that's been
   *        read from a cache and whose freshness should be checked.
   * @param {Number} [input.now] A timestamp.
   *
   * Defaults to the current time.
   * @return {boolean} Either `true` if the response is fresh, or `false` if the
   * `Response` is older than `maxAgeSeconds` and should no longer be
   * used.
   *
   * @example
   * expirationPlugin.isResponseFresh({
   *   cachedResponse: responseFromCache
   * });
   */
  isResponseFresh({cachedResponse, now} = {}) {
    // Only bother checking for freshness if we have a valid response and if
    // maxAgeSeconds is set. Otherwise, skip the check and always return true.
    if (cachedResponse && this.maxAgeSeconds) {
      isInstance({cachedResponse}, Response);

      const dateHeader = cachedResponse.headers.get('date');
      if (dateHeader) {
        if (typeof now === 'undefined') {
          now = Date.now();
        }

        const parsedDate = new Date(dateHeader);
        // If the Date header was invalid for some reason, parsedDate.getTime()
        // will return NaN, and the comparison will always be false. That means
        // that an invalid date will be treated as if the response is fresh.
        if ((parsedDate.getTime() + (this.maxAgeSeconds * 1000)) < now) {
          // Only return false if all the conditions are met.
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Updates the timestamp stored in IndexedDB for `url` to be equal to `now`.
   *
   * When using this class directly (i.e. not via `CacheExpirationPlugin`),
   * it's your responsibility to call `updateTimestap()` each time an entry is
   * put into the cache. Otherwise, the `expireEntries()` method will not
   * know which entries to remove.
   *
   * @example
   * expirationPlugin.updateTimestamp({
   *   cacheName: 'example-cache-name',
   *   url: '/example-url'
   * });
   *
   * @param {Object} input
   * @param {string} input.cacheName Name of the cache the Responses belong to.
   * @param {string} input.url The URL for the entry to update. The hash portion
   * of the URL will be ignored.
   * @param {Number} [input.now] A timestamp. Defaults to the current time.
   */
  async updateTimestamp({cacheName, url, now} = {}) {
    isType({url}, 'string');
    isType({cacheName}, 'string');

    // Remove the hash, if present.
    const urlObject = new URL(url, location);
    urlObject.hash = '';

    if (typeof now === 'undefined') {
      now = Date.now();
    }

    const db = await this.getDB({cacheName});
    const tx = db.transaction(cacheName, 'readwrite');
    tx.objectStore(cacheName).put({
      [timestampPropertyName]: now,
      [urlPropertyName]: urlObject.href,
    });

    await tx.complete;
  }

  /**
   * Expires entries based on the the maximum age and the maximum number
   * of entries defined in the constructor.
   *
   * To avoid concurrency issues, calls to this method when it's already running
   * will result in the call begin re-run after the current execution has
   * finished.
   *
   * @param {Object} input
   * @param {string} input.cacheName Name of the cache to review and expire
   * entries for.
   * @param {Number} [input.now] A timestamp to treat as now. This is largely
   * only useful for testing purposes.
   *
   * Defaults to the current time.
   * @return {Promise} Resolves when the cache expiration has been performed. If
   * the function is currently executing the Promise will resolve immediately.
   *
   * @example
   * // Assume that entries have been added to 'example-cache-name', and that
   * // updateTimestamp() was called after each entry was added.
   * cacheExpiration.expireEntries({
   *   cacheName: 'example-cache-name'
   * });
   */
  async expireEntries({cacheName, now} = {}) {
    // Since there's a single shared IDB instance that's queried to find entries
    // to expire, this method doesn't need to run multiple times simultaneously.
    // Use this._expirationMutex as a concurrency lock, and save the last value
    // that it's been called with in this._timestampForNextRun as a signal
    // to run it again once complete.
    if (this._expirationMutex) {
      this._timestampForNextRun = now;
      return;
    }
    this._expirationMutex = true;

    isType({cacheName}, 'string');

    if (typeof now === 'undefined') {
      now = Date.now();
    }

    // First, expire old entries, if maxAgeSeconds is set.
    const oldEntries = this.maxAgeSeconds ?
      await this.findOldEntries({cacheName, now}) :
      [];

    // Once that's done, check for the maximum size.
    const extraEntries = this.maxEntries ?
      await this.findExtraEntries({cacheName}) :
      [];

    // Use a Set to remove any duplicates following the concatenation, then
    // convert back into an array.
    const urls = [...new Set(oldEntries.concat(extraEntries))];
    await this.deleteFromCacheAndIDB({cacheName, urls});

    if (urls.length > 0) {
      logHelper.debug({
        that: this,
        message: 'Expired entries have been removed from the cache.',
        data: {cacheName, urls},
      });
    }

    this._expirationMutex = false;
    // If this method has been called while it was already running, then call
    // it again now that the asynchronous operations are complete, using the
    // most recent timestamp that was passed in.
    if (this._timestampForNextRun) {
      const savedTimestamp = this._timestampForNextRun;
      this._timestampForNextRun = null;
      return this.expireEntries({cacheName, now: savedTimestamp});
    }
  }

  /**
   * Expires entries based on the the maximum age.
   *
   * @private
   * @param {Object} input
   * @param {string} input.cacheName Name of the cache the Responses belong to.
   * @param {Number} [input.now] A timestamp.
   * @return {Array<string>} A list of the URLs that were expired.
   */
  async findOldEntries({cacheName, now} = {}) {
    isType({cacheName}, 'string');
    isType({now}, 'number');

    const expireOlderThan = now - (this.maxAgeSeconds * 1000);
    const urls = [];
    const db = await this.getDB({cacheName});
    const tx = db.transaction(cacheName, 'readonly');
    const store = tx.objectStore(cacheName);
    const timestampIndex = store.index(timestampPropertyName);

    timestampIndex.iterateCursor((cursor) => {
      if (!cursor) {
        return;
      }

      if (cursor.value[timestampPropertyName] < expireOlderThan) {
        urls.push(cursor.value[urlPropertyName]);
      }

      cursor.continue();
    });

    await tx.complete;
    return urls;
  }

  /**
   * Finds the URLs that should be expired as per the current state of IndexedDB
   * and the `maxEntries` configuration. A least-recently used policy is
   * enforced, so if `maxEntries` is `N`, and there are `N + M` URLs listed in
   * IndexedDB, then this function will return the least-recently used `M` URLs.
   *
   * @private
   * @param {Object} input
   * @param {string} input.cacheName Name of the cache the Responses belong to.
   * @return {Array<string>} A list of the URLs that are candidates for
   *   expiration.
   */
  async findExtraEntries({cacheName} = {}) {
    isType({cacheName}, 'string');

    const urls = [];
    const db = await this.getDB({cacheName});
    let tx = db.transaction(cacheName, 'readonly');
    let store = tx.objectStore(cacheName);
    let timestampIndex = store.index(timestampPropertyName);
    const initialCount = await timestampIndex.count();

    if (initialCount > this.maxEntries) {
      // We need to create a new transaction to make Firefox happy.
      tx = db.transaction(cacheName, 'readonly');
      store = tx.objectStore(cacheName);
      timestampIndex = store.index(timestampPropertyName);

      timestampIndex.iterateCursor((cursor) => {
        if (!cursor) {
          return;
        }

        urls.push(cursor.value[urlPropertyName]);

        if (initialCount - urls.length > this.maxEntries) {
          cursor.continue();
        }
      });
    }

    await tx.complete;
    return urls;
  }

  /**
   * Removes entries corresponding to each of the URLs from both the Cache
   * Storage API and from IndexedDB.
   *
   * @private
   * @param {Object} input
   * @param {string} input.cacheName Name of the cache the Responses belong to.
   * @param {Array<string>} urls The URLs to delete.
   */
  async deleteFromCacheAndIDB({cacheName, urls} = {}) {
    isType({cacheName}, 'string');
    isArrayOfType({urls}, 'string');

    if (urls.length > 0) {
      const cache = await this.getCache({cacheName});
      const db = await this.getDB({cacheName});

      for (let url of urls) {
        await cache.delete(url);
        const tx = db.transaction(cacheName, 'readwrite');
        const store = tx.objectStore(cacheName);
        store.delete(url);
        await tx.complete;
      }
    }
  }
}

export default CacheExpiration;
