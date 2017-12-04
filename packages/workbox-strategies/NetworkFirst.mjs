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

import {cacheNames} from 'workbox-core/_private/cacheNames.mjs';
import {cacheWrapper} from 'workbox-core/_private/cacheWrapper.mjs';
import {fetchWrapper} from 'workbox-core/_private/fetchWrapper.mjs';
import {assert} from 'workbox-core/_private/assert.mjs';
import {logger} from 'workbox-core/_private/logger.mjs';

import messages from './utils/messages.mjs';
import cacheOkAndOpaquePlugin from './plugins/cacheOkAndOpaquePlugin.mjs';
import './_version.mjs';

// TODO: Change opaque responses to d.g.c link
// TODO: Replace `plugins` parameter link with link to d.g.c.

/**
 * An implementation of a
 * [network first]{@link https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#network-falling-back-to-cache}
 * request strategy.
 *
 * By default, this strategy will cache responses with a 200 status code as
 * well as [opaque responses]{@link https://developers.google.com/web/tools/workbox/guides/handle-third-party-requests}.
 * Opaque responses are are cross-origin requests where the response doesn't
 * support [CORS]{@link https://enable-cors.org/}.
 *
 * @memberof workbox.strategies
 */
class NetworkFirst {
  /**
   * @param {Object} options
   * @param {string} options.cacheName Cache name to store and retrieve
   * requests. Defaults to cache names provided by
   * [workbox-core]{@link workbox.core.cacheNames}.
   * @param {string} options.plugins [Plugins]{@link https://docs.google.com/document/d/1Qye_GDVNF1lzGmhBaUvbgwfBWRQDdPgwUAgsbs8jhsk/edit?usp=sharing}
   * to use in conjunction with this caching strategy.
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
          moduleName: 'workbox-strategies',
          className: 'NetworkFirst',
          funcName: 'constructor',
          paramName: 'networkTimeoutSeconds',
        });
      }
    }
  }

  /**
   * This method will perform a request strategy and follows an API that
   * will work with the
   * [Workbox Router]{@link workbox.routing.Router}.
   *
   * @param {Object} input
   * @param {FetchEvent} input.event The fetch event to run this strategy
   * against.
   * @return {Promise<Response>}
   */
  async handle({event}) {
    const logs = [];
    if (process.env.NODE_ENV !== 'production') {
      assert.isInstance(event, FetchEvent, {
        moduleName: 'workbox-strategies',
        className: 'NetworkFirst',
        funcName: 'handle',
        paramName: 'event',
      });
    }

    const promises = [];
    let timeoutId;

    if (this._networkTimeoutSeconds) {
      const {id, promise} = this._getTimeoutPromise(event, logs);
      timeoutId = id;
      promises.push(promise);
    }

    const networkPromise = this._getNetworkPromise(timeoutId, event, logs);
    promises.push(networkPromise);

    const response = await Promise.race(promises);

    if (process.env.NODE_ENV !== 'production') {
      logger.groupCollapsed(
        messages.strategyStart('NetworkFirst', event));
      for (let log of logs) {
        logger.log(log);
      }
      messages.printFinalResponse(response);
      logger.groupEnd();
    }

    return response;
  }

  /**
   * @param {FetchEvent} event
   * @param {Array} logs A reference to the logs array
   * @return {Promise<Response>}
   *
   * @private
   */
  _getTimeoutPromise(event, logs) {
    let timeoutId;
    const timeoutPromise = new Promise((resolve) => {
      const onNetworkTimeout = async () => {
        if (process.env.NODE_ENV !== 'production') {
          logs.push(`Timing out the network response at ` +
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
   * @param {Array} logs A reference to the logs Array.
   * @return {Promise<Response>}
   *
   * @private
   */
  async _getNetworkPromise(timeoutId, event, logs) {
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
        logs.push(`Got response from network.`);
      } else {
        logs.push(`Unable to get a response from the network. Will respond ` +
          `with a cached response.`);
      }
    }

    if (error || !response) {
      response = await this._respondFromCache(event.request);
      if (process.env.NODE_ENV !== 'production') {
        if (response) {
          logs.push(`Found a cached response in the '${this._cacheName}'` +
            ` cache.`);
        } else {
          logs.push(`No response found in the '${this._cacheName}' cache.`);
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
