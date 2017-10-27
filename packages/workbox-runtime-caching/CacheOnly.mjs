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

import {
  cacheNames,
  cacheWrapper,
  assert,
  logger,
} from 'workbox-core/_private.mjs';
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
    this._cacheName = cacheNames.getRuntimeName(options.cacheName);
    this._plugins = options.plugins || [];
  }

  /**
   * This method will be called by the Workbox
   * [Router]{@link module:workbox-routing.Router} to handle a fetch event.
   *
   * @param {Object} input
   * @param {FetchEvent} input.event The fetch event to handle.
   * @param {URL} input.url The URL of the request.
   * @param {Object} input.params Any params returned by `Routes` match
   * callback.
   * @return {Promise<Response>}
   */
  async handle({url, event, params}) {
    const logMessages = [];

    if (process.env.NODE_ENV !== 'production') {
      assert.isInstance(event, FetchEvent, {
        moduleName: 'workbox-runtime-caching',
        className: 'CacheOnly',
        funcName: 'handle',
        paramName: 'event',
      });
    }

    const response = await cacheWrapper.match(
      this._cacheName,
      event.request,
      null,
      this._plugins
    );

    if (process.env.NODE_ENV !== 'production') {
      if (response) {
        logMessages.push(`Found a cached response in '${this._cacheName}'`);
      } else {
        logMessages.push(`No response found in cache '${this._cacheName}'`);
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      const urlObj = new URL(event.request.url);
      const urlToDisplay = urlObj.origin === location.origin ?
        urlObj.pathname : urlObj.href;
      logger.groupCollapsed(`Using CacheOnly to repond to ` +
        `'${urlToDisplay}'`);
      logMessages.forEach((msg) => {
        logger.unprefixed.log(msg);
      });

      if (response) {
        logger.groupCollapsed(`View the final response here.`);
        logger.unprefixed.log(response);
        logger.groupEnd();
      }

      logger.groupEnd();
    }

    return response;
  }
}

export {CacheOnly};
