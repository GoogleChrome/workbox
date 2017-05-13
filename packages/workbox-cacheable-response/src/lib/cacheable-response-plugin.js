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

import CacheableResponse from './cacheable-response';

/**
 * Use this plugin to cache responses with certain HTTP status codes or
 * header values.
 *
 * Defining both status codes and headers will cache requests with a matching
 * status code and a matching header.
 *
 * This class is meant to be automatically invoked as a plugin to a
 * {@link module:workbox-runtime-caching.RequestWrapper|RequestWrapper}, which
 * is used by the `workbox-sw` and `workbox-runtime-caching` modules.
 *
 * If you would like to use this functionality outside of the `RequestWrapper`
 * context, please use the `CacheableResponse` class directly.
 *
 * @example
 * new workbox.cacheableResponse.CacheableResponsePlugin({
 *   statuses: [0, 200, 404],
 *   headers: {
 *     'Example-Header-1': 'Header-Value-1'
 *     'Example-Header-2': 'Header-Value-2'
 *   }
 * });
 *
 * @memberof module:workbox-cacheable-response
 */
class CacheableResponsePlugin extends CacheableResponse {
  /**
   * A "lifecycle" callback that will be triggered automatically by the
   * `workbox.runtimeCaching` handlers prior to an entry being added to a cache.
   *
   * @private
   * @param {Object} input
   * @param {Request} input.request The request that led to the response.
   * @param {Response} input.response The response that might be cached.
   * @return {boolean} `true` if the `Response` is cacheable, based on the
   *          configuration of this object, and `false` otherwise.
   */
  cacheWillUpdate({request, response} = {}) {
    return this.isResponseCacheable({request, response});
  }
}

export default CacheableResponsePlugin;
