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

import messages from './utils/messages.mjs';
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
    if (process.env.NODE_ENV !== 'production') {
      assert.isInstance(event, FetchEvent, {
        moduleName: 'workbox-runtime-caching',
        className: 'NetworkFirst',
        funcName: 'handle',
        paramName: 'event',
      });

      logger.groupCollapsed(
        messages.strategyStart('NetworkFirst', event));
    }

    const promises = [];
    let timeoutId;

    if (this._networkTimeoutSeconds) {
      const {id, promise} = this._getTimeoutPromise(event);
      timeoutId = id;
      promises.push(promise);
    }

    const networkPromise = this._getNetworkPromise(timeoutId, event);
    promises.push(networkPromise);

    const response = await Promise.race(promises);

    if (process.env.NODE_ENV !== 'production') {
      messages.printFinalResponse(response);
      logger.groupEnd();
    }

    return response;
  }

  /**
   * @param {FetchEvent} event
   * @return {Promise<Response>}
   */
  _getTimeoutPromise(event) {
    let timeoutId;
    const timeoutPromise = new Promise((resolve) => {
      const onNetworkTimeout = async () => {
        if (process.env.NODE_ENV !== 'production') {
          logger.log(`Timing out the network response at ` +
            `${this._networkTimeoutSeconds} seconds.`);
        }

        resolve(await this._respondFromCache(event.request));
      };

      timeoutId = setTimeout(
        onNetworkTimeout,
        this._networkTimeoutSeconds * 1000,
      );
    });

    return {
      promise: timeoutPromise,
      id: timeoutId,
    };
  }

  /**
   * @param {number} timeoutId
   * @param {FetchEvent} event
   * @return {Promise<Response>}
   */
  async _getNetworkPromise(timeoutId, event) {
    let error;
    let response;
    try {
      response = await fetchWrapper.fetch(
        event.request,
        this._plugins
      );
    } catch (err) {
      error = err;
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (process.env.NODE_ENV !== 'production') {
      if (response) {
        logger.log(`Got response from network.`);
      } else {
        logger.log(`Unable to get a response from the network. Will respond ` +
          `with a cached response.`);
      }
    }

    if (error || !response) {
      response = await this._respondFromCache(event.request);
      if (process.env.NODE_ENV !== 'production') {
        if (response) {
          logger.log(`Found a cached response in the '${this._cacheName}'` +
            ` cache.`);
        } else {
          logger.log(`No response found in the '${this._cacheName}' cache.`);
        }
      }
    } else {
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
  }

  /**
   * Used if the network timeouts or fails to make the request.
   *
   * @param {Request} request The fetchEvent request to match in the cache
   * @return {Promise<Object>}
   *
   * @private
   */
  _respondFromCache(request) {
    return cacheWrapper.match(
      this._cacheName,
      request,
      null,
      this._plugins
    );
  }
}

export {NetworkFirst};
