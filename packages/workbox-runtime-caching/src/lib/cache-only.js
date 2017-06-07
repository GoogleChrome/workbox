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

import Handler from './handler';
import {isInstance} from '../../../../lib/assert';

/**
 * An implementation of a [cache-only](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-only)
 * request strategy.
 *
 * The advantage to using this versus directly calling `caches.match()` is that
 * it will use the cache configuration and trigger the plugins defined in
 * the underlying `RequestWrapper` which accounts for behaviors like cache
 * expiration.
 *
 * @example
 * // Set up a route to match any requests made for URLs that end in .txt.
 * // The requests are handled with a cache-only strategy.
 * const route = new workbox.routing.RegExpRoute({
 *   regExp: /\.txt$/,
 *   handler: new workbox.runtimeCaching.CacheOnly(),
 * });
 *
 * const router = new workbox.routing.Router();
 * router.registerRoute({route});
 *
 * @memberof module:workbox-runtime-caching
 * @extends module:workbox-runtime-caching.Handler
 */
class CacheOnly extends Handler {
  /**
   * The handle method will be called by the
   * {@link module:workbox-routing.Route|Route} class when a route matches a
   * request.
   *
   * @param {Object} input
   * @param {FetchEvent} input.event The event that triggered the service
   *        worker's fetch handler.
   * @return {Promise.<Response>} The response from the cache or null.
   */
  async handle({event} = {}) {
    isInstance({event}, FetchEvent);

    return await this.requestWrapper.match({request: event.request});
  }
}

export default CacheOnly;
