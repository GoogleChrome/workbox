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

import {_private} from 'workbox-core';
import core from 'workbox-core';
import './_version.mjs';

/**
 * An implementation of a
 * [cache-only]{@link https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-only}
 * request strategy.
 *
 * This class is useful if you want to take advantage of the Workbox plugins.
 *
 * @memberof module:workbox-runtime-caching
 */
class CacheOnly {
  /**
   * @param {Object} options
   * @param {string} options.cacheName Cache name to store and retrieve
   * requests. Defaults to cache names provided by `workbox-core`.
   * @param {string} options.plugins Workbox plugins you may want to use in
   * conjunction with this caching strategy.
   */
  constructor(options = {}) {
    this._cacheName =
      _private.cacheNames.getRuntimeName(options.cacheName);
    this._plugins = options.plugins || [];
  }

  /**
   * This method will be called by the Workbox
   * [Router]{@link module:workbox-routing.Router} to handle a fetch event.
   *
   * @param {FetchEvent} event The fetch event to handle.
   * @return {Promise<Response>}
   */
  async handle(event) {
    if (process.env.NODE_ENV !== 'production') {
      core.assert.isInstance(event, FetchEvent, {
        moduleName: 'workbox-runtime-caching',
        className: 'CacheOnly',
        funcName: 'handle',
        paramName: 'event',
      });
    }

    return _private.cacheWrapper.match(
      this._cacheName,
      event.request,
      null,
      this._plugins
    );
  }
}

export default CacheOnly;
