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

import assert from '../../../../lib/assert';
import {behaviorCallbacks, defaultCacheName} from './constants';

/**
 * This class is used by the various subclasses of `Handler` to configure the
 * cache name and any desired request/cache behaviors.
 *
 * It automatically triggers any registered behaviors at the appropriate time.
 * The current set of behavior callbacks, along with the parameters they're
 * given and when they're called, is:
 *
 *   - `cacheDidUpdate({cacheName, oldResponse, newResponse})`: Called whenever
 *   a new entry is written to the cache.
 *   - `fetchDidFail({request})`: Called whenever a network request fails.
 *   - `requestWillFetch({request})`: Called prior to making a network request.
 *
 * @memberof module:sw-runtime-caching
 */
class RequestWrapper {
  /**
   * @param {string} [cacheName] The name of the cache to use for Handlers that
   *        involve caching. If none is provided, a default name that uses the
   *        current service worker scope will be used.
   * @param {Array.<Object>} [behaviors] Any behaviors that should be invoked.
   * @param {Object} [fetchOptions] Values passed along to the
   *        [`init`](https://developer.mozilla.org/en-US/docs/Web/API/GlobalFetch/fetch#Parameters)
   *        of all `fetch()` requests made by this wrapper.
   * @param {Object} [matchOptions] Values passed along to the
   *        [`options`](https://developer.mozilla.org/en-US/docs/Web/API/Cache/match#Parameters)
   *        of all cache `match()` requests made by this wrapper.
   */
  constructor({cacheName, behaviors, fetchOptions, matchOptions} = {}) {
    if (cacheName) {
      assert.isType({cacheName}, 'string');
      this.cacheName = cacheName;
    } else {
      this.cacheName = defaultCacheName;
    }

    if (fetchOptions) {
      assert.isType({fetchOptions}, 'object');
      this.fetchOptions = fetchOptions;
    }

    if (matchOptions) {
      assert.isType({matchOptions}, 'object');
      this.matchOptions = matchOptions;
    }

    this.callbacks = {};

    if (behaviors) {
      assert.isInstance({behaviors}, Array);

      behaviors.forEach((behavior) => {
        for (let callbackName of behaviorCallbacks) {
          if (typeof behavior[callbackName] === 'function') {
            if (!this.callbacks[callbackName]) {
              this.callbacks[callbackName] = [];
            }
            this.callbacks[callbackName].push(
              behavior[callbackName].bind(behavior));
          }
        }
      });
    }
  }

  /**
   * @return {Cache} The cache for this RequestWrapper.
   */
  async getCache() {
    if (!this._cache) {
      this._cache = await caches.open(this.cacheName);
    }
    return this._cache;
  }

  /**
   * Wraps `cache.match()`, using the previously configured cache name and match
   * options.
   *
   * @param {Object} input
   * @param {Request|string} input.request The key for the cache lookup.
   * @return {Promise.<Response>} The cached response.
   */
  async match({request}) {
    assert.atLeastOne({request});

    const cache = await this.getCache();
    return await cache.match(request, this.matchOptions);
  }

  /**
   * Wraps `fetch()`, and calls any `fetchDidFail` callbacks from the
   * registered behaviors if the request fails.
   *
   * @param {Object} input
   * @param {Request|string} input.request The request or URL to be fetched.
   * @return {Promise.<Response>} The network response.
   */
  async fetch({request}) {
    assert.atLeastOne({request});

    return await fetch(request, this.fetchOptions).catch((error) => {
      if (this.callbacks.fetchDidFail) {
        for (let callback of this.callbacks.fetchDidFail) {
          callback({request});
        }
      }

      throw error;
    });
  }

  /**
   * Combines both fetching and caching, using the previously configured options
   * and calling the appropriate behaviors.
   *
   * @param {Object} input
   * @param {Request} input.request
   * @return {Promise.<Response>} The network response.
   */
  async fetchAndCache({request}) {
    assert.atLeastOne({request});

    const response = await this.fetch({request});
    if (response.ok || response.type === 'opaque') {
      const newResponse = response.clone();

      // Run the cache update sequence asynchronously, without blocking the
      // response from getting to the client.
      this.getCache().then(async (cache) => {
        let oldResponse;

        // Only bother getting the old response if the new response isn't opaque
        // and there's at least one cacheDidUpdateCallbacks. Otherwise, we don't
        // need it.
        if (response.type !== 'opaque' && this.callbacks.cacheDidUpdate) {
          oldResponse = await this.match({request});
        }

        // Regardless of whether or not we'll end up invoking
        // cacheDidUpdateCallbacks, wait until the cache is updated.
        await cache.put(request, newResponse);

        // If oldResponse is set, we want to trigger cacheDidUpdateCallbacks.
        if (oldResponse) {
          for (let callback of this.callbacks.cacheDidUpdate) {
            callback({cacheName: this.cacheName, oldResponse, newResponse});
          }
        }
      });
    }

    // Return a response right away, so that the client could make use of it,
    // without waiting for the cache update sequence to complete.
    return response;
  }
}

export default RequestWrapper;
