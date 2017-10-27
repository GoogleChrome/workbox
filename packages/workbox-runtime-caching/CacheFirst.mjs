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
  fetchWrapper,
  assert,
} from 'workbox-core/_private.mjs';
import './_version.mjs';

/**
 * An implementation of a [cache-first]{@link https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-falling-back-to-network}
 * request strategy.
 *
 * A cache first strategy is useful for assets that are revisioned since they
 * can be cached for long periods of time, saving the users data.
 *
 * @memberof module:workbox-runtime-caching
 */
class CacheFirst {
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
    let error;
    if (process.env.NODE_ENV !== 'production') {
      assert.isInstance(event, FetchEvent, {
        moduleName: 'workbox-runtime-caching',
        className: 'CacheFirst',
        funcName: 'handle',
        paramName: 'event',
      });
    }

    let response = await cacheWrapper.match(
      this._cacheName,
      event.request,
      null,
      this._plugins
    );

    if (process.env.NODE_ENV !== 'production') {
      if (response) {
        logMessages.push(`Cached response found.`);
        logMessages.push(response);
      } else {
        logMessages.push(`No cached response found, requesting from network.`);
      }
    }

    if (!response) {
      try {
        response = await fetchWrapper.fetch(
          event.request,
          null,
          this._plugins
        );

        // Keep the service worker while we put the request to the cache
        const responseClone = response.clone();
        event.waitUntil(
          _private.cacheWrapper.put(
            this._cacheName,
            event.request,
            responseClone,
            this._plugins
          )
        );
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          logMessages.push(`Failed to get response from network.`, err);
        }
        error = err;
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      const urlObj = new URL(event.request.url);
      const urlToDisplay = urlObj.origin === location.origin ?
        urlObj.pathname : urlObj.href;
      _private.logger.groupCollapsed(`Using CacheFirst to repond to ` +
        `'${urlToDisplay}'`);
      logMessages.forEach((msg) => {
        _private.logger.unprefixed.log(msg);
      });
      _private.logger.end();
    }

    if (error) {
      // Don't swallow error as we'll want it to throw and enable catch
      // handlers in router.
      throw error;
    }

    return response;
  }
}

export {CacheFirst};
