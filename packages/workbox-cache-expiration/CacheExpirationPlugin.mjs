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

import {_private} from 'workbox-core';
import core from 'workbox-core';

import CacheExpiration from './CacheExpiration.mjs';
import './_version.mjs';

/**
 *
 */
class CacheExpirationPlugin {
  /**
   * @param {Object} config
   * @param {number} [config.maxEntries] The maximum number of entries to cache.
   * Entries used the least will be removed as the maximum is reached.
   * @param {number} [config.maxAgeSeconds] The maximum age of an entry before
   * it's treated as stale and removed.
   */
  constructor(config) {
    if (process.env.NODE_ENV !== 'production') {
      if (!(config.maxEntries || config.maxAgeSeconds)) {
        throw new _private.WorkboxError('max-entries-or-age-required');
      }

      if (config.maxEntries) {
        core.assert.isType(config.maxEntries, 'number', {
          moduleName: 'workbox-cache-expiration',
          className: 'CacheExpirationPlugin',
          funcName: 'constructor',
          paramName: 'config.maxEntries',
        });
      }

      if (config.maxAgeSeconds) {
        core.assert.isType(config.maxAgeSeconds, 'number', {
          moduleName: 'workbox-cache-expiration',
          className: 'CacheExpirationPlugin',
          funcName: 'constructor',
          paramName: 'config.maxAgeSeconds',
        });
      }
    }

    this._maxEntries = config.maxEntries;
    this._maxAgeSeconds = config.maxAgeSeconds;
    this._cacheExpirations = new Map();
  }

  /**
   * A simple helper method to return a CacheExpiration instance for a given
   * cache name.
   *
   * @param {string} cacheName
   * @return {CacheExpiration}
   *
   * @private
   */
  _getCacheExpiration(cacheName) {
    let cacheExpiration = this._cacheExpirations.get(cacheName);
    if (!cacheExpiration) {
      cacheExpiration = new CacheExpiration(cacheName, this._config);
      this._cacheExpirations.put(cacheName, cacheExpiration);
    }
    return cacheExpiration;
  }

  /**
   * A "lifecycle" callback that will be triggered automatically by the
   * `workbox.runtimeCaching` handlers when a `Response` is about to be returned
   * from a [Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache) to
   * the handler. It allows the `Response` to be inspected for freshness and
   * prevents it from being used if the `Response`'s `Date` header value is
   * older than the configured `maxAgeSeconds`.
   *
   * @private
   * @param {Object} input
   * @param {string} input.cacheName Name of the cache the responses belong to.
   * @param {Response} input.cachedResponse The `Response` object that's been
   *        read from a cache and whose freshness should be checked.
   * @return {Response} Either the `cachedResponse`, if it's
   *         fresh, or `null` if the `Response` is older than `maxAgeSeconds`.
   */
  cachedResponseWillBeUsed({cacheName, cachedResponse} = {}) {
    if (this.isResponseFresh({cacheName, cachedResponse})) {
      return cachedResponse;
    }

    return null;
  }

  /**
   * A "lifecycle" callback that will be triggered automatically by the
   * `workbox.runtimeCaching` handlers when an entry is added to a cache.
   *
   * @private
   * @param {Object} input
   * @param {string} input.cacheName Name of the cache the responses belong to.
   * @param {Response} input.newResponse The new value in the cache.
   * @param {string} input.url The URL for the cache entry.
   */
  async cacheDidUpdate({cacheName, newResponse, url} = {}) {
    if (process.env.NODE_ENV !== 'production') {
      core.assert.isType(cacheName, 'string', {
        moduleName: 'workbox-cache-expiration',
        className: 'CacheExpirationPlugin',
        funcName: 'cacheDidUpdate',
        paramName: 'cacheName',
      });
      core.assert.isInstance(newResponse, Response, {
        moduleName: 'workbox-cache-expiration',
        className: 'CacheExpirationPlugin',
        funcName: 'cacheDidUpdate',
        paramName: 'newResponse',
      });
    }

    const cacheExpiration = this._getCacheExpiration(cacheName);
    await cacheExpiration.updateTimestamp(url);
    await cacheExpiration.expireEntries();
  }

  /**
   * Checks whether a `Response` is "fresh", based on the `Response's`
   * `Date` header and the `maxAgeSeconds` parameter passed into the
   * constructor.
   *
   * The general approach is to default to fresh unless proven otherwise.
   *
   * If `maxAgeSeconds` or the `Date` header is not set then it will
   * default to returning `true`, i.e. the response is still fresh and should
   * be used.
   *
   * @param {Object} input
   * @param {string} input.cacheName
   * @param {Response} input.cachedResponse The `Response` object that's been
   *        read from a cache and whose freshness should be checked.
   *
   * Defaults to the current time.
   * @return {boolean} Either `true` if the response is fresh, or
   * `false` if the `Response` is older than `maxAgeSeconds` and should no
   * longer be used.
   */
  isResponseFresh({cacheName, cachedResponse}) {
    // Only bother checking for freshness if we have a valid response and if
    // maxAgeSeconds is set.
    if (cachedResponse && this._maxAgeSeconds) {
      if (process.env.NODE_ENV !== 'production') {
        core.assert.isInstance(cachedResponse, Response, {
          moduleName: 'workbox-cache-expiration',
          className: 'CacheExpirationPlugin',
          funcName: 'isResponseFresh',
          paramName: 'cachedResponse',
        });
      }

      const now = Date.now();
      const dateHeader = cachedResponse.headers['date'];
      if (dateHeader) {
        const parsedDate = new Date(dateHeader);
        const headerTime = parsedDate.getTime();
        // If the Date header was invalid for some reason, parsedDate.getTime()
        // will return NaN. We want to treat that as a fresh response, since we
        // assume fresh unless proven otherwise.
        if (isNaN(headerTime)) {
          return true;
        }

        // If we have a valid headerTime, then our response is fresh iff the
        // headerTime plus maxAgeSeconds is greater than the current time.
        return (headerTime + (this._maxAgeSeconds * 1000)) > now;
      } else {
        // TODO (jeffposnick): Change this method interface to be async, and
        // check for the IDB for the specific URL in order to determine
        // freshness when Date is not available.

        // If there is no Date header (i.e. if this is a cross-origin response),
        // then we don't know for sure whether the response is fresh or not.
        // One thing we can do is trigger cache expiration, which will clean up
        // any old responses based on IDB timestamps, and ensure that when a
        // cache-first handler is used, stale responses will eventually be
        // replaced (though not until the *next* request is made).
        // See https://github.com/GoogleChrome/workbox/issues/691

        const cacheExpiration = this._getCacheExpiration(cacheName);
        cacheExpiration.expireEntries();

        // Return true, since otherwise a cross-origin cached response without
        // a Date header would *never* be considered valid.
        return true;
      }
    }

    // If either cachedResponse or maxAgeSeconds wasn't set, then the response
    // is "trivially" fresh, so return true.
    return true;
  }
}

export default CacheExpirationPlugin;
