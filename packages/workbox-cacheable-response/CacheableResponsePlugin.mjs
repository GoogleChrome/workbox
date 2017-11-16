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

import './_version.mjs';

/**
 * A class implementing the `cacheWillUpdate` lifecycle callback. This makes it
 * easier to add in cacheability checks to requests made via Workbox's built-in
 * strategies.
 *
 * @memberof workbox.cacheableResponse
 */
class CacheableResponsePlugin {
  /**
   * @param {CacheableResponse} cacheableResponse A configured
   * `CacheableResponse` instance.
   */
  constructor(cacheableResponse) {
    this._cacheableResponse = cacheableResponse;
    this.cacheWillUpdate = this.cacheWillUpdate.bind(this);
  }

  /**
   * @param {Object} options
   * @param {Response} options.response
   * @return {boolean}
   * @private
   */
  cacheWillUpdate({response}) {
    return this._cacheableResponse.isResponseCacheable(response);
  }
}

export {CacheableResponsePlugin};
