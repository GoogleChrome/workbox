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
import core from 'workbox-core';

import CacheTimestampsModel from './models/CacheTimestampsModel.mjs';
import './_version.mjs';

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
    if (process.env.NODE_ENV !== 'production') {
      core.assert.isType(cacheName, 'string', {
        moduleName: 'workbox-cache-expiration',
        className: 'CacheExpirationManager',
        funcName: 'constructor',
        paramName: 'cacheName',
      });

      if (!(config.maxEntries || config.maxAgeSeconds)) {
        throw new _private.WorkboxError('max-entries-or-age-required');
      }

      if (config.maxEntries) {
        core.assert.isType(config.maxEntries, 'number', {
          moduleName: 'workbox-cache-expiration',
          className: 'CacheExpirationManager',
          funcName: 'constructor',
          paramName: 'config.maxEntries',
        });
      }

      if (config.maxAgeSeconds) {
        core.assert.isType(config.maxAgeSeconds, 'number', {
          moduleName: 'workbox-cache-expiration',
          className: 'CacheExpirationManager',
          funcName: 'constructor',
          paramName: 'config.maxAgeSeconds',
        });
      }
    }

    this._maxEntries = config.maxEntries;
    this._maxAgeSeconds = config.maxAgeSeconds;
    this._timestampModel = new CacheTimestampsModel(cacheName);
  }

  /**
   * Expires entries for the given cache and given criteria.
   *
   * @return {Promise<Array<string>>} Returns an array of URLs that were
   * removed.
   */
  async expireEntries() {
    const now = Date.now();

    // First, expire old entries, if maxAgeSeconds is set.
    const oldEntries = await this._findOldEntries(now);

    // Once that's done, check for the maximum size.
    const extraEntries = await this._findExtraEntries();

    // Use a Set to remove any duplicates following the concatenation, then
    // convert back into an array.
    const allUrls = [...new Set(oldEntries.concat(extraEntries))];
    await Promise.all([
      this._deleteFromCache(allUrls),
      this._deleteFromIDB(allUrls),
    ]);

    if (process.env.NODE_ENV !== 'production') {
      // TODO break apart entries deleted due to expiration vs size restraints
      _private.logger.groupCollapsed(
        `Expired ${allUrls.length} entries have been removed from the cache.`);
      _private.logger.debug(`Cache name:`, this._cacheName);
      _private.logger.debug(`URLS:`, allUrls);
      _private.logger.groupEnd();
    }

    return allUrls;
  }

  /**
   * Expires entries based on the the maximum age.
   *
   * @param {number} expireFromTimestamp A timestamp.
   * @return {Promise<Array<string>>} A list of the URLs that were expired.
   *
   * @private
   */
  async _findOldEntries(expireFromTimestamp) {
    if (process.env.NODE_ENV !== 'production') {
      core.assert.isType(expireFromTimestamp, 'number', {
        moduleName: 'workbox-cache-expiration',
        className: 'CacheExpirationManager',
        funcName: '_findOldEntries',
        paramName: 'expireFromTimestamp',
      });
    }

    if (!this._maxAgeSeconds) {
      return [];
    }

    const expireOlderThan = expireFromTimestamp - (this._maxAgeSeconds * 1000);
    const timestamps = await this._timestampModel.getAllTimestamps();
    const expiredUrls = [];
    timestamps.forEach((timestampDetails) => {
      if (timestampDetails.timestamp < expireOlderThan) {
        expiredUrls.push(timestampDetails.url);
      }
    });

    return expiredUrls;
  }

  /**
   * @return {Promise<Array>}
   *
   * @private
   */
  async _findExtraEntries() {
    const extraUrls = [];

    if (!this._maxEntries) {
      return [];
    }

    const timestamps = await this._timestampModel.getAllTimestamps();
    while (timestamps.length > this._maxEntries) {
      if (timestamps.length === 0) {
        break;
      }

      const lastUsed = timestamps.shift();
      extraUrls.push(lastUsed.url);
    }

    return extraUrls;
  }

  /**
   * @return {Promise}
   *
   * @private
   */
  _deleteFromCache() {
    return Promise.resolve();
  }

  /**
   * @param {Array<string>} urls Array of URLs to delete from IDB
   *
   * @private
   */
  async _deleteFromIDB(urls) {
    for (const url of urls) {
      await this._timestampModel.deleteUrl(url);
    }
  }
}

export default CacheExpirationManager;
