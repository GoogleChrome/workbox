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
    this._cacheName =
      _private.cacheNames.getRuntimeName(options.cacheName);

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
        core.assert.isType(this._networkTimeoutSeconds, 'number', {
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
   * @param {FetchEvent} event The fetch event to handle.
   * @return {Promise<Response>}
   */
  async handle(event) {
    if (process.env.NODE_ENV !== 'production') {
      core.assert.isInstance(event, FetchEvent, {
        moduleName: 'workbox-runtime-caching',
        className: 'CacheFirst',
        funcName: 'handle',
        paramName: 'event',
      });
    }

    const promises = [];
    let timeoutId;

    if (this._networkTimeoutSeconds) {
      promises.push(new Promise((resolve) => {
        const onNetworkTimeout = () => {
          resolve(this._respondFromCache(event.request));
        };

        timeoutId = setTimeout(
          onNetworkTimeout,
          this._networkTimeoutSeconds * 1000,
        );
      }));
    }

    const networkPromise = _private.fetchWrapper.fetch(
      event.request,
      this._plugins
    )
    .then((response) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (!response) {
        return this._respondFromCache(event.request);
      }

      // Keep the service worker alive while we put the request in the cache
      const responseClone = response.clone();
      event.waitUntil(
        _private.cacheWrapper.put(
          this._cacheName,
          event.request,
          responseClone,
          this._plugins
        )
      );

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
    () => this._respondFromCache(event.request));

    promises.push(networkPromise);

    return Promise.race(promises);
  }

  /**
   * Used if the network timeouts or fails to make the request.
   *
   * @param {Request} request The fetchEvent request to match in the cache
   * @return {Promise<Response>}
   *
   * @private
   */
  _respondFromCache(request) {
    return _private.cacheWrapper.match(
      this._cacheName,
      request,
      null,
      this._plugins
    );
  }
}

export default NetworkFirst;
