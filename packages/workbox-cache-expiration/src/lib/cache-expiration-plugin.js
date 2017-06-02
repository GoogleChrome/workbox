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

import CacheExpiration from './cache-expiration';
import {isType, isInstance} from '../../../../lib/assert';

/**
 * The `CacheExpirationPlugin` class allows you define an expiration and / or
 * limit on the responses cached.
 *
 * This class is meant to be automatically invoked as a plugin to a
 * {@link module:workbox-runtime-caching.RequestWrapper|RequestWrapper}, which
 * is used by the `workbox-sw` and `workbox-runtime-caching` modules.
 *
 * If you would like to use this functionality outside of the `RequestWrapper`
 * context, please use the [CacheExpiration]{@link
 *  module:workbox-cache-expiration.CacheExpiration} class directly.
 *
 * @example
 * const plugin = new workbox.cacheExpiration.CacheExpirationPlugin({
 *   maxEntries: 2,
 *   maxAgeSeconds: 10,
 * });
 *
 * @memberof module:workbox-cache-expiration
 */
class CacheExpirationPlugin extends CacheExpiration {
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
   * @param {Response} input.cachedResponse The `Response` object that's been
   *        read from a cache and whose freshness should be checked.
   * @param {Number} [input.now] A timestamp. Defaults to the current time.
   * @return {Response|null} Either the `cachedResponse`, if it's fresh, or
   *          `null` if the `Response` is older than `maxAgeSeconds`.
   */
  cacheWillMatch({cachedResponse, now} = {}) {
    if (this.isResponseFresh({cachedResponse, now})) {
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
   * @param {Number} [input.now] A timestamp. Defaults to the current time.
   */
  async cacheDidUpdate({cacheName, newResponse, url, now} = {}) {
    isType({cacheName}, 'string');
    isInstance({newResponse}, Response);

    if (typeof now === 'undefined') {
      now = Date.now();
    }

    await this.updateTimestamp({cacheName, url, now});
    await this.expireEntries({cacheName, now});
  }
}

export default CacheExpirationPlugin;
