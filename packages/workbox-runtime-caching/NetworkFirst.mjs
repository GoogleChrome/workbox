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
  logger,
} from 'workbox-core/_private.mjs';

import cacheOkAndOpaquePlugin from './plugins/cacheOkAndOpaquePlugin.mjs';
import './_version.mjs';

/**
 * An implementation of a
 * [network first]{@link https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#network-falling-back-to-cache}
 * request strategy.
 *
 * By default, this strategy will cache responses with a 200 status code as
 * well as [opaque responses]{@link http://stackoverflow.com/q/39109789}.
 * Opaque responses are are cross-origin requests where the response doesn't
 * support [CORS]{@link https://enable-cors.org/}.
 *
 * @memberof module:workbox-runtime-caching
 */
class NetworkFirst {
  /**
   * @param {Object} options
   * @param {string} options.cacheName Cache name to store and retrieve
   * requests. Defaults to cache names provided by `workbox-core`.
   * @param {string} options.plugins Workbox plugins you may want to use in
   * conjunction with this caching strategy.
   * @param {number} options.networkTimeoutSeconds If set, any network requests
   * that fail to respond within the timeout will fallback to the cache.
   *
   * This option can be used to combat
   * "[lie-fi]{@link https://developers.google.com/web/fundamentals/performance/poor-connectivity/#lie-fi}"
   * scenarios.
   */
  constructor(options = {}) {
    this._cacheName = cacheNames.getRuntimeName(options.cacheName);

    if (options.plugins) {
      let isUsingCacheWillUpdate =
        options.plugins.some((plugin) => !!plugin.cacheWillUpdate);
      this._plugins = isUsingCacheWillUpdate ?
        options.plugins : [cacheOkAndOpaquePlugin, ...options.plugins];
    } else {
      // No plugins passed in, use the default plugin.
      this._plugins = [cacheOkAndOpaquePlugin];
    }

    this._networkTimeoutSeconds = options.networkTimeoutSeconds;
    if (process.env.NODE_ENV !== 'production') {
      if (this._networkTimeoutSeconds) {
        assert.isType(this._networkTimeoutSeconds, 'number', {
          moduleName: 'workbox-runtime-caching',
          className: 'NetworkFirst',
          funcName: 'constructor',
          paramName: 'networkTimeoutSeconds',
        });
      }
    }
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
        className: 'NetworkFirst',
        funcName: 'handle',
        paramName: 'event',
      });
    }

    const promises = [];
    let timeoutId;

    if (this._networkTimeoutSeconds) {
      promises.push(new Promise((resolve) => {
        const onNetworkTimeout = async () => {
          if (process.env.NODE_ENV !== 'production') {
            logMessages.push(`Timing out the network response at ` +
              `${this._networkTimeoutSeconds} seconds.`);
          }

          const {cachedResponse, logMessages} =
            await this._respondFromCache(event.request);
          logMessages.push(...logMessages);
          resolve(cachedResponse);
        };

        timeoutId = setTimeout(
          onNetworkTimeout,
          this._networkTimeoutSeconds * 1000,
        );
      }));
    }

    const networkPromise = fetchWrapper.fetch(
      event.request,
      this._plugins
    )
    .then(async (response) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (process.env.NODE_ENV !== 'production') {
        if (response) {
          logMessages.push(`A response was retrieved from the network with ` +
            `status code '${response.status}', this will be returned to the ` +
            `browser.`);
        } else {
          logMessages.push(`A response could not be retrieved from the ` +
            `network.`);
        }
      }

      if (!response) {
        const {cachedResponse, logMessages} =
          await this._respondFromCache(event.request);
        logMessages.push(...logMessages);
        response = cachedResponse;
      } else {
        if (process.env.NODE_ENV !== 'production') {
          logMessages.push(`Will add the response to the cache ` +
            `'${this._cacheName}' if it's valid.`);
        }
        // Keep the service worker alive while we put the request in the cache
        const responseClone = response.clone();
        event.waitUntil(
          cacheWrapper.put(
            this._cacheName,
            event.request,
            responseClone,
            this._plugins
          )
        );
      }

      return response;
    },
    // This catches any errors from the fetchWrapper.fetch() method and ONLY
    // that method. This means that in the fetchWrapper.fetch().then() we
    // can handle a null Response (caused by plugins intercepting the Response)
    // and fallback to the cache while also falling back to cache *if* the
    // method throws an error.
    // NOTE: If this was a .catch(), it would call _responseFromCache inside the
    // .then(), which could fail and throw, which would be caught and a second
    // _responseFromCache call will be made.
    async (err) => {
      if (process.env.NODE_ENV !== 'production') {
        logMessages.push([
          `The network request threw a error, will look for a response ` +
          `in the cache.`, err]);
      }
      const {cachedResponse, logMessages} =
        await this._respondFromCache(event.request);
      logMessages.push(...logMessages);
      return cachedResponse;
    });

    promises.push(networkPromise);

    const finalResponse = await Promise.race(promises);

    if (process.env.NODE_ENV !== 'production') {
      const urlObj = new URL(event.request.url);
      const urlToDisplay = urlObj.origin === location.origin ?
        urlObj.pathname : urlObj.href;
      logger.groupCollapsed(`Using NetworkFirst to repond to ` +
        `'${urlToDisplay}'`);

        logMessages.forEach((msg) => {
          if (Array.isArray(msg)) {
            logger.unprefixed.log(...msg);
          } else {
            logger.unprefixed.log(msg);
          }
        });

      if (finalResponse) {
        logger.groupCollapsed(`View the final response here.`);
        logger.unprefixed.log(finalResponse);
        logger.groupEnd();
      }

      logger.groupEnd();
    }

    return finalResponse;
  }

  /**
   * Used if the network timeouts or fails to make the request.
   *
   * @param {Request} request The fetchEvent request to match in the cache
   * @return {Promise<Object>}
   *
   * @private
   */
  async _respondFromCache(request) {
    const logMessages = [];
    const response = await cacheWrapper.match(
      this._cacheName,
      request,
      null,
      this._plugins
    );

    if (process.env.NODE_ENV !== 'production') {
      if (response) {
        logMessages.push(`Cached response found in '${this._cacheName}'` +
          `, responding to fetch event with it.`);
      } else {
        logMessages.push(`No cached response found in ` +
          `'${this._cacheName}'.`);
      }
    }

    return {
      response,
      logMessages,
    };
  }
}

export {NetworkFirst};
