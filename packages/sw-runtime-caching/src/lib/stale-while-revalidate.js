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
import assert from '../../../../lib/assert';

/**
 * @memberof module:sw-runtime-caching
 * @extends module:sw-runtime-caching.Handler
 */
class StaleWhileRevalidate extends Handler {
  /**
   * An implementation of a [stale-while-revalidate](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#stale-while-revalidate)
   * request strategy.
   *
   * In addition to updating the appropriate caches, if will also trigger any
   * appropriate behaviors defined in the underlying `RequestWrapper`.
   *
   * @alias StaleWhileRevalidate.handle
   * @param {Object} input An object wrapper for the underlying parameters.
   * @param {FetchEvent} input.event The event that triggered the service
   *        worker's fetch handler.
   * @return {Promise.<Response>} The response from the cache, if present, or
   *          from the network if not.
   */
  async handle({event} = {}) {
    assert.isInstance({event}, FetchEvent);

    const fetchAndCacheResponse = this.requestWrapper.fetchAndCache({
      request: event.request,
    }).catch(() => Response.error());
    const cachedResponse = await this.requestWrapper.match({
      request: event.request,
    });

    return cachedResponse || await fetchAndCacheResponse;
  }
}

export default StaleWhileRevalidate;
