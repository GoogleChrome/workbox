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
 * An implementation of a [cache-first](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-falling-back-to-network)
 * request strategy.
 *
 * The important thing to note with this caching strategy is that once a
 * response is cached, it will not be updated. This is useful for assets
 * that are revisioned since it caches the asset long term and doesn't waste
 * the user's data.
 *
 * @example
 * // Set up a route to match any requests made for URLs that end in .txt.
 * // The requests are handled with a cache-first strategy.
 * const route = new workbox.routing.RegExpRoute({
 *   regExp: /\.txt$/,
 *   handler: new workbox.runtimeCaching.CacheFirst(),
 * });
 *
 * const router = new workbox.routing.Router();
 * router.registerRoute({route});
 *
 * @memberof module:workbox-runtime-caching
 * @extends module:workbox-runtime-caching.Handler
 */
class CacheFirst extends Handler {
  /**
   * The handle method will be called by the
   * {@link module:workbox-routing.Route|Route} class when a route matches a
   * request.
   *
   * @param {Object} input
   * @param {FetchEvent} input.event The event that triggered the service
   *        worker's fetch handler.
   * @return {Promise.<Response>} The response, either from the cache,
   *          or if that isn't available, the request will be made on the
   *          the network and the result will be cached for future use.
   */
  async handle({event} = {}) {
    isInstance({event}, FetchEvent);

    const cachedResponse = await this.requestWrapper.match({
      request: event.request,
    });

    return cachedResponse || await this.requestWrapper.fetchAndCache({
      request: event.request,
      waitOnCache: this.waitOnCache,
    });
  }
}

export default CacheFirst;
