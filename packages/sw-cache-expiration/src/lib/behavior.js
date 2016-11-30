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
import assert from '../../../../lib/assert';
import {idbName, idbVersion, urlProperty, timestampProperty} from './constants';

/**
 * @memberof module:sw-cache-expiration
 *
 * @example
 * // Used as an automatically invoked as "behavior" by a RequestWrapper:
 *
 * const cacheName = 'runtime-cache';
 * const requestWrapper = new goog.runtimeCaching.RequestWrapper({
 *   cacheName,
 *   behaviors: [
 *     new goog.cacheExpiration.Behavior({cacheName, maxEntries: 10})
 *   ]
 * });
 *
 * // Set up a route to match any requests made against the example.com domain.
 * // The requests will be handled with a stale-while-revalidate policy, and the
 * // cache size will be capped at 10 entries.
 * const route = new goog.routing.RegExpRoute({
 *   match: ({url}) => url.domain === 'example.com',
 *   handler: new goog.runtimeCaching.StaleWhileRevalidate({requestWrapper})
 * });
 *
 * @example
 * // Explicitly invoked usage independent of the goog.routing framework, via
 * // the expireOldEntries() method:
 *
 * // TODO: Write sample code.
 */
class Behavior {
  /**
   * Creates a new `Behavior` instance, which is used to remove entries from a
   * [`Cache`](https://developer.mozilla.org/en-US/docs/Web/API/Cache) once
   * certain criteria—maximum number of entries, age of entry, or both—is met.
   *
   * @param {Object} input The input object to this function.
   * @param {string} input.cacheName The name of the cache.
   * @param {Number} [input.maxEntries] The maximum size of the cache. Entries
   *        will be expired using a LRU policy once the cache reaches this size.
   * @param {Number} [input.maxAgeSeconds] The maximum age for fresh entries.
   */
  constructor({cacheName, maxEntries, maxAgeSeconds} = {}) {
    assert.isType({cacheName}, 'string');
    assert.atLeastOne({maxEntries, maxAgeSeconds});

    this.cacheName = cacheName;
    this.maxEntries = maxEntries;
    this.maxAgeSeconds = maxAgeSeconds;
  }

  /**
   * Returns a promise for the IndexedDB database used to keep track of state
   * for `this.cacheName`.
   *
   * @private
   * @return {DB} An open DB instance.
   */
  async getDB() {
    if (!this._db) {
      this._db = await idb.open(idbName, idbVersion, (upgradeDB) => {
        const objectStore = upgradeDB.createObjectStore(this.cacheName,
          {keyPath: urlProperty});
        objectStore.createIndex(timestampProperty, timestampProperty,
          {unique: false});
      });
    }

    return this._db;
  }

  /**
   * Returns a promise for an open Cache instance named `this.cacheName`.
   *
   * @private
   * @return {Cache} An open Cache instance.
   */
  async getCache() {
    if (!this._cache) {
      this._cache = await caches.open(this.cacheName);
    }

    return this._cache;
  }

  /**
   * A "lifecycle" callback that will be triggered automatically by the
   * goog.runtimeCaching handlers when an entry is added to a cache.
   *
   * Developers would normally not call this method directly; instead,
   * [`updateTimestamp`](#updateTimestamp) combined with
   * [`expireEntries`](#expireEntries) provides equivalent behavior.
   *
   * @private
   * @param {Object} input The input object to this function.
   * @param {string} input.cacheName Name of the cache the Responses belong to.
   * @param {Response} input.newResponse The new value in the cache.
   */
  cacheDidUpdate({cacheName, newResponse} = {}) {
    assert.isType({cacheName}, 'string');
    assert.isValue({cacheName}, this.cacheName);
    assert.isInstance({newResponse}, Response);

    const now = Date.now();
    this.updateTimestamp({now, url: newResponse.url}).then(() => {
      this.expireEntries({now});
    });
  }

  /**
   * Updates the timestamp stored in IndexedDB for `url` to be equal to `now`.
   *
   * @param {Object} input The input object to this function.
   * @param {string} input.url
   * @param {Number} [input.now] A timestamp. Defaults to the current time.
   * @return {Promise} Resolves once the update transaction is complete.
   */
  async updateTimestamp({url, now}) {
    assert.isType({url}, 'string');

    if (typeof now === 'undefined') {
      now = Date.now();
    }

    const db = await this.getDB();
    const tx = db.transaction(this.cacheName, 'readwrite');
    tx.objectStore(this.cacheName).put({
      [timestampProperty]: now,
      [urlProperty]: url,
    });

    await tx.complete;
  }

  /**
   * Expires entries, both based on the the maximum age and the maximum number
   * of entries, depending on how this instance is configured.
   *
   * @param {Object} input The input object to this function.
   * @param {Number} [input.now] A timestamp. Defaults to the current time.
   * @return {Array<string>} A list of the URLs that were expired.
   */
  async expireEntries({now} = {}) {
    if (typeof now === 'undefined') {
      now = Date.now();
    }

    // First, expire old entries, if maxAgeSeconds is set.
    const oldEntries = this.maxAgeSeconds ?
      await this.findOldEntries({now}) :
      [];

    // Once that's done, check for the maximum size.
    const extraEntries = this.maxEntries ?
      await this.findExtraEntries() :
      [];

    const urls = [...new Set(oldEntries.concat(extraEntries))];
    await this.deleteFromCacheAndIDB({urls});

    return urls;
  }

  /**
   * Expires entries based on the the maximum age.
   *
   * @private
   * @param {Object} input The input object to this function.
   * @param {Number} [input.now] A timestamp.
   * @return {Array<string>} A list of the URLs that were expired.
   */
  async findOldEntries({now} = {}) {
    assert.isType({now}, 'number');

    const expireOlderThan = now - (this.maxAgeSeconds * 1000);
    const urls = [];
    const db = await this.getDB();
    const tx = db.transaction(this.cacheName, 'readonly');
    const store = tx.objectStore(this.cacheName);
    const index = store.index(timestampProperty);

    index.iterateCursor(async (cursor) => {
      if (!cursor) {
        return;
      }

      if (cursor.value[timestampProperty] < expireOlderThan) {
        urls.push(cursor.value[urlProperty]);
      }

      cursor.continue();
    });

    await tx.complete;
    return urls;
  }

  /**
   * Expires entries base on the the maximum cache size.
   *
   * @private
   * @return {Array<string>} A list of the URLs that were expired.
   */
  async findExtraEntries() {
    const urls = [];
    const db = await this.getDB();
    const tx = db.transaction(this.cacheName, 'readonly');
    const store = tx.objectStore(this.cacheName);
    const index = store.index(timestampProperty);
    const initialCount = await index.count();

    if (initialCount > this.maxEntries) {
      index.iterateCursor(async (cursor) => {
        if (!cursor) {
          return;
        }

        urls.push(cursor.value[urlProperty]);

        if (initialCount - urls.length > this.maxEntries) {
          cursor.continue();
        }
      });
    }

    await tx.complete;
    return urls;
  }

  async deleteFromCacheAndIDB({urls} = {}) {
    assert.isInstance({urls}, Array);

    if (urls.length > 0) {
      const cache = await this.getCache();
      const db = await this.getDB();

      await urls.forEach(async (url) => {
        await cache.delete(url);
        const tx = db.transaction(this.cacheName, 'readwrite');
        const store = tx.objectStore(this.cacheName);
        await store.delete(url);
        await tx.complete;
      });
    }
  }
}

export default Behavior;
