/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {CacheableResponse} from './CacheableResponse.mjs';
import './_version.mjs';

/**
 * A class implementing the `cacheWillUpdate` lifecycle callback. This makes it
 * easier to add in cacheability checks to requests made via Workbox's built-in
 * strategies.
 *
 * @memberof workbox.cacheableResponse
 */
class Plugin {
  /**
   * To construct a new cacheable response Plugin instance you must provide at
   * least one of the `config` properties.
   *
   * If both `statuses` and `headers` are specified, then both conditions must
   * be met for the `Response` to be considered cacheable.
   *
   * @param {Object} config
   * @param {Array<number>} [config.statuses] One or more status codes that a
   * `Response` can have and be considered cacheable.
   * @param {Object<string,string>} [config.headers] A mapping of header names
   * and expected values that a `Response` can have and be considered cacheable.
   * If multiple headers are provided, only one needs to be present.
   */
  constructor(config) {
    this._cacheableResponse = new CacheableResponse(config);
  }

  /**
   * @param {Object} options
   * @param {Response} options.response
   * @return {boolean}
   * @private
   */
  cacheWillUpdate({response}) {
    if (this._cacheableResponse.isResponseCacheable(response)) {
      return response;
    }
    return null;
  }
}

export {Plugin};
