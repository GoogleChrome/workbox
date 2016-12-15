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

import assert from '../../../../lib/assert';

/**
 * @memberof module:sw-cacheable-response-behavior
 *
 * @example
 * // Used as an automatically invoked as "behavior" by a RequestWrapper:
 *
 * const cacheName = 'runtime-cache';
 * const requestWrapper = new goog.runtimeCaching.RequestWrapper({
 *   cacheName,
 *   behaviors: [
 *     new goog.cacheableResponse.Behavior({
 *       statuses: [0, 200, 404]
 *     })
 *   ]
 * });
 *
 * // Set up a route to match any requests made against the example.com domain.
 * // The responses will be cached if the response code is 0, 200, or 404, and
 * // will not be cached otherwise.
 * const route = new goog.routing.RegExpRoute({
 *   match: ({url}) => url.domain === 'example.com',
 *   handler: new goog.runtimeCaching.StaleWhileRevalidate({requestWrapper})
 * });
 *
 * @example
 * // Explicitly invoked usage independent of the goog.routing framework, via
 * // the isResponseCacheable() method:
 *
 * // TODO: Write sample code.
 */
class Behavior {
  /**
   * Creates a new `Behavior` instance, which stores configuration and logic
   * to determine whether a `Response` object is cacheable or not.
   *
   * If multiple criteria are present (e.g. both `statuses` and `headers`), then
   * the `Response` needs to meet all of the criteria to be cacheable.
   *
   * @param {Object} input The input object to this function.
   * @param {Array<Number>} [input.statuses] The status codes that are
   *        checked when determining whether a `Response` is cacheable.
   * @param {Object<String,String>} [input.headers] The header values that are
   *        checked when determining whether a `Response` is cacheable.
   */
  constructor({statuses, headers} = {}) {
    assert.atLeastOne({statuses, headers});
    if (statuses !== undefined) {
      assert.isInstance({statuses}, Array);
    }
    if (headers !== undefined) {
      assert.isType({headers}, 'object');
    }

    this.statuses = statuses;
    this.headers = headers;
  }

  /**
   * A "lifecycle" callback that will be triggered automatically by the
   * `goog.runtimeCaching` handlers prior to an entry being added to a cache.
   *
   * Developers would normally not call this method directly; instead,
   * [`isResponseCacheable`](#isResponseCacheable) provides equivalent behavior
   * when used outside of `goog.runtimeCaching`.
   *
   * @private
   * @param {Object} input The input object to this function.
   * @param {Response} input.newResponse The response that might be cached.
   * @return {boolean} `true` if the `Response` is cacheable, based on the
   *          configuration of this object, and `false` otherwise.
   */
  cacheWillUpdate({response} = {}) {
    return this.isResponseCacheable({response});
  }

  /**
   * Checks a response to see whether it's cacheable or not, based on the
   * configuration of this object.
   *
   * @private
   * @param {Object} input The input object to this function.
   * @param {Response} input.newResponse The response that might be cached.
   * @return {boolean} `true` if the `Response` is cacheable, based on the
   *          configuration of this object, and `false` otherwise.
   */
  isResponseCacheable({response} = {}) {
    assert.isInstance({response}, Response);
    let cacheable = true;

    if (this.statuses) {
      cacheable = this.statuses.includes(response.status);
    }

    if (this.headers && cacheable) {
      cacheable = Object.keys(this.headers).some((headerName) => {
        return response.headers.get(headerName) === this.headers[headerName];
      });
    }

    return cacheable;
  }
}

export default Behavior;
