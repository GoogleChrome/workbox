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

import {createPartialResponse} from './createPartialResponse.mjs';

import './_version.mjs';

/**
 * A class implementing the `cachedResponseWillBeUsed` lifecycle callback.
 * This makes it easier to add in support for used cached responses to fulfill
 * requests with `Range:` headers.
 *
 * If an incoming request does contain a `Range:` header, then the appropriate
 * subset of the cached body will be returned as part of a HTTP 416 response.
 *
 * If the incoming request does not contain a `Range:` header, then the cached
 * response will be used as-is.
 *
 * @memberof workbox.rangeRequests
 */
class Plugin {
  /**
   * @param {Object} options
   * @param {Request} options.request The original request, which may or may not
   * contain a Range: header.
   * @param {Response} options.cachedResponse The complete cached response.
   * @return {Promise<Response>} If request contains a Range: header, then
   * a Response with status 206 whose body is a subset of cachedResponse. If
   * request does not have a Range: header, then cachedResponse is returned
   * as-is.
   *
   * @private
   */
  static async cachedResponseWillBeUsed({request, cachedResponse} = {}) {
    // Only return a sliced response if there's a Range: header in the request.
    if (request.headers.has('range')) {
      return await createPartialResponse(request, cachedResponse);
    }

    // If there was no Range: header, return the original response as-is.
    return cachedResponse;
  }
}

export {Plugin};
