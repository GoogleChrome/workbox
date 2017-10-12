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

import {_private} from 'workbox-core';

/**
 * The `CacheExpiration` class allows you define an expiration and / or
 * limit on the number of responses stored in a
 * [`Cache`](https://developer.mozilla.org/en-US/docs/Web/API/Cache).
 */
class CacheExpirationManager {
  /**
   * To construct a new CacheExpiration instance you must provide at least
   * one of the `config` properties.
   *
   * @param {string} cacheName Name of the cache to apply restrictions to.
   * @param {Object} config
   * @param {number} [config.maxEntries] The maximum number of entries to cache.
   * Entries used the least will be removed as the maximum is reached.
   * @param {number} [config.maxAgeSeconds] The maximum age of an entry before
   * it's treated as stale and removed.
   */
  constructor(cacheName, config) {
    if (process.env.NODE_ENV === 'production') {
      assert.isType(cacheName, 'string', {

      });

      if (!(config.maxEntries || config.maxAgeSeconds)) {
        throw new WorkboxError('max-entries-or-age-required'));
      }

      if (config.maxEntries) {
        // TODO add in assertion details.
        assert.isType(config.maxEntries, 'number', {

        });
      }

      if (config.maxAgeSeconds) {
        // TODO add in assertion details.
        assert.isType(config.maxEntries, 'number', {

        });
      }
    }

    this._maxEntries = config.maxEntries;
    this._maxAgeSeconds = config.maxAgeSeconds;

    // This is used to ensure there's one asynchronous expiration operation
    // running at a time.
    // this._expirationMutex = false;
    // If another expiration request comes in, the timestamp is saved here and
    // re-run after.
    // this._timestampForNextRun = null;
  }

  expireEntries() {
    // Since there's a single shared IDB instance that's queried to find entries
    // to expire, this method doesn't need to run multiple times simultaneously.
    // Use this._expirationMutex as a concurrency lock, and save the last value
    // that it's been called with in this._timestampForNextRun as a signal
    // to run it again once complete.
    // if (this._expirationMutex) {
    //   this._timestampForNextRun = now;
    //   return;
    // }
    // this._expirationMutex = true;

    if (process.env.NODE_ENV !== 'production') {
      // TODO Add assert values
      assert.isType(cacheName, 'string', {

      });
    }

    const now = Date.now();

    // First, expire old entries, if maxAgeSeconds is set.
    const oldEntries = await this._findOldEntries(now);

    // Once that's done, check for the maximum size.
    /**  const extraEntries = this._maxEntries ?
      await this._findExtraEntries() :
      [];**/

    // Use a Set to remove any duplicates following the concatenation, then
    // convert back into an array.
    const urls = [...new Set(oldEntries.concat(extraEntries))];
    await Promise.all([
      // this._deleteFromCache(urls),
      // this._deleteFromIDB(urls),
    ]);

    if (process.env.NODE_ENV) {
      _private.logger.groupCollapsed(
        `Expired ${urls.length}entries have been removed from the cache.`);
      _private.logger.debug(`Cache name:`, cacheName);
      _private.logger.debug(`URLS:`, urls);
      _private.logger.groupEnd();
    }

    // If this method has been called while it was already running, then call
    // it again now that the asynchronous operations are complete, using the
    // most recent timestamp that was passed in.
    // if (this._timestampForNextRun) {
    //   const savedTimestamp = this._timestampForNextRun;
    //   this._timestampForNextRun = null;
    //   return this.expireEntries({cacheName, now: savedTimestamp});
    // }
  }

  /**
   * Expires entries based on the the maximum age.
   *
   * @param {Number} timestamp A timestamp.
   * @return {Array<string>} A list of the URLs that were expired.
   *
   * @private
   */
  async _findOldEntries(timestamp) {
    if (process.env.NODE_ENV !== 'production') {
      assert.isType(timestamp, 'number');
    }

    if (!this._maxAgeSeconds) {
      return [];
    }

    const expireOlderThan = timestamp - (this._maxAgeSeconds * 1000);
    const urls = [];
    const db = await this._getDB({cacheName});
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
   * Get db for this model.
   *
   * @return{Promise<DBWrapper>}
   */
  _getDb() {
    return _private.indexedDBHelper.getDB(
      `workbox-cache-expiration`, `expiration-details-model`);
  }
}

export default CacheExpiration;
