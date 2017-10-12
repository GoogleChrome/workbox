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
   */
  async expireEntries() {
    const now = Date.now();

    // First, expire old entries, if maxAgeSeconds is set.
    const oldEntries = await this._findOldEntries(now);

    // Once that's done, check for the maximum size.
    const extraEntries = await this._findExtraEntries();

    // Use a Set to remove any duplicates following the concatenation, then
    // convert back into an array.
    const urls = [...new Set(oldEntries.concat(extraEntries))];
    await Promise.all([
      this._deleteFromCache(urls),
      this._deleteFromIDB(urls),
    ]);

    if (process.env.NODE_ENV) {
      _private.logger.groupCollapsed(
        `Expired ${urls.length}entries have been removed from the cache.`);
      _private.logger.debug(`Cache name:`, this._cacheName);
      _private.logger.debug(`URLS:`, urls);
      _private.logger.groupEnd();
    }
  }

  /**
   * Expires entries based on the the maximum age.
   *
   * @param {number} timestamp A timestamp.
   * @return {Promise<Array<string>>} A list of the URLs that were expired.
   *
   * @private
   */
  async _findOldEntries(timestamp) {
    if (process.env.NODE_ENV !== 'production') {
      core.assert.isType(timestamp, 'number', {
        moduleName: 'workbox-cache-expiration',
        className: 'CacheExpirationManager',
        funcName: '_findOldEntries',
        paramName: 'timestamp',
      });
    }

    if (!this._maxAgeSeconds) {
      return [];
    }

    // TODO (gauntface) find old entries

    return [];
  }

  /**
   * @return {Promise<Array>}
   *
   * @private
   */
  async _findExtraEntries() {
    return [];
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
   * @return {Promise}
   *
   * @private
   */
  _deleteFromIDB() {
    return Promise.resolve();
  }
}

export default CacheExpirationManager;
