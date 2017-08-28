/*
 Copyright 2017 Google Inc. All Rights Reserved.
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

import handleRangeRequest from './handle-range-request.js';

/**
 * This class is meant to be automatically invoked as a plugin to a
 * {@link module:workbox-runtime-caching.RequestWrapper|RequestWrapper}, which
 * is used by the `workbox-sw` and `workbox-runtime-caching` modules. If you
 * are not using `workbox-sw` or `workbox-runtime-caching`, then using the
 * {@link handleRangeRequest} function directly is recommended.
 *
 * Under the hood, this will call `handleRangeRequest()`, passing
 * in the appropriate request and response objects.
 *

 *
 * @example
 * const workboxSW = new WorkboxSW();
 *
 * const cacheFirstRangeHandler = workboxSW.strategies.cacheFirst({
 *   cacheName: 'range-requests',
 *   // There's no need to instantiate the class; all methods are static.
 *   plugins: [workbox.rangedRequests.CachedRangeResponsePlugin]
 * });
 *
 * // Create a route which will match all requests that have a Range: header,
 * // and handle them using a cache-first strategy, taking the Range: header
 * // into account.
 * workboxSW.registerRoute(
 *   ({event}) => event.request.headers.has('range'),
 *   cacheFirstRangeHandler
 * );
 */
class CachedRangeResponsePlugin {
  /**
   * @private
   * @param {Object} input
   * @param {Request} input.request The original request, which may or may not
   * contain a Range: header.
   * @param {Response} input.cachedResponse The complete cached response.
   * @return {Promise<Response>} If request contains a Range: header, then
   * a Response with status 206 whose body is a subset of cachedResponse. If
   * request does not have a Range: header, then cachedResponse is returned
   * as-is.
   */
  static async cachedResponseWillBeUsed({request, cachedResponse} = {}) {
    // Only return a sliced response if there's a Range: header in the request.
    if (request.headers.has('range')) {
      return await handleRangeRequest({
        request,
        response: cachedResponse,
      });
    }

    // If there was no Range: header, return the original response as-is.
    return cachedResponse;
  }
}

export default CachedRangeResponsePlugin;
