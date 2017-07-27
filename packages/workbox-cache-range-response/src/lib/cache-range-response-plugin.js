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

import CachedRangeResponse from './cache-range-response';

/**
 * @memberof module:workbox-cache-range-response
 */
class CachedRangeResponsePlugin extends CachedRangeResponse {
  /**
   * @param {Object} input
   * @param {Request} input.request The original request, which may or may not
   * contain a Range: header.
   * @param {Response} input.cachedResponse The complete cached response.
   * @return {Promise<Response>} If request contains a Range: header, then
   * a Response with status 206 whose body is a subset of cachedResponse. If
   * request does not have a Range: header, then cachedResponse is returned
   * as-is.
   */
  static async cacheWillMatch({request, cachedResponse} = {}) {
    // Only return a sliced response if there's a Range: header in the request.
    if (request.headers.has('range')) {
      return await CachedRangeResponsePlugin.sliceResponse({
        request,
        response: cachedResponse,
      });
    }

    // If there was no Range: header, return the original response as-is.
    return cachedResponse;
  }
}

export default CachedRangeResponsePlugin;
