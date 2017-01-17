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
class CacheOnly extends Handler {
  /**
   * An implementation of a [cache-only](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-only)
   * request strategy.
   *
   * The advantage to using this vs. directly calling `caches.match()` is that
   * it will use the cache configuration and trigger the behaviors defined in
   * the underlying `RequestWrapper`.
   *
   * @alias CacheOnly.handle
   * @param {Object} input An object wrapper for the underlying parameters.
   * @param {FetchEvent} input.event The event that triggered the service
   *        worker's fetch handler.
   * @return {Promise.<Response>} The response from the cache.
   */
  async handle({event} = {}) {
    assert.isInstance({event}, FetchEvent);

    return await this.requestWrapper.match({request: event.request});
  }
}

export default CacheOnly;
