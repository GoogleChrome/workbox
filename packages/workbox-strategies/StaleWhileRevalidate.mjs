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
import {logger} from 'workbox-core/_private/logger.mjs';
import {assert} from 'workbox-core/_private/assert.mjs';

import messages from './utils/messages.mjs';
import cacheOkAndOpaquePlugin from './plugins/cacheOkAndOpaquePlugin.mjs';
import './_version.mjs';

// TODO: Replace `Workbox plugins` link in the class description with a
// link to d.g.c.
// TODO: Replace `plugins` parameter link with link to d.g.c.

/**
 * An implementation of a
 * [stale-while-revalidate]{@link https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#stale-while-revalidate}
 * request strategy.
 *
 * Resources are requested from both the cache and the network in parallel.
 * The strategy will respond with the cached version if available, otherwise
 * wait for the network response. The cache is updated with the network response
 * with each successful request.
 *
 * By default, this strategy will cache responses with a 200 status code as
 * well as [opaque responses]{@link https://developers.google.com/web/tools/workbox/guides/handle-third-party-requests}.
 * Opaque responses are are cross-origin requests where the response doesn't
 * support [CORS]{@link https://enable-cors.org/}.
 *
 * @memberof workbox.strategies
 */
class StaleWhileRevalidate {
  /**
   * @param {Object} options
   * @param {string} options.cacheName Cache name to store and retrieve
   * requests. Defaults to cache names provided by
   * [workbox-core]{@link workbox.core.cacheNames}.
   * @param {string} options.plugins [Plugins]{@link https://docs.google.com/document/d/1Qye_GDVNF1lzGmhBaUvbgwfBWRQDdPgwUAgsbs8jhsk/edit?usp=sharing}
   * to use in conjunction with this caching strategy.
   */
  constructor(options = {}) {
    this._cacheName = cacheNames.getRuntimeName(options.cacheName);
      this._plugins = options.plugins || [];

    if (options.plugins) {
      let isUsingCacheWillUpdate =
        options.plugins.some((plugin) => !!plugin.cacheWillUpdate);
      this._plugins = isUsingCacheWillUpdate ?
        options.plugins : [cacheOkAndOpaquePlugin, ...options.plugins];
    } else {
      // No plugins passed in, use the default plugin.
      this._plugins = [cacheOkAndOpaquePlugin];
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
        className: 'StaleWhileRevalidate',
        funcName: 'handle',
        paramName: 'event',
      });
    }

    const fetchAndCachePromise = this._getFromNetwork(event);

    let response = await cacheWrapper.match(
      this._cacheName,
      event.request,
      null,
      this._plugins
    );

    if (response) {
      if (process.env.NODE_ENV !== 'production') {
        logs.push(`Found a cached response in the '${this._cacheName}'` +
          ` cache. Will update with the network response in the background.`);
      }
      event.waitUntil(fetchAndCachePromise);
    } else {
      if (process.env.NODE_ENV !== 'production') {
        logs.push(`No response found in the '${this._cacheName}' cache. ` +
          `Will wait for the network response.`);
      }
      response = await fetchAndCachePromise;
    }

    if (process.env.NODE_ENV !== 'production') {
      logger.groupCollapsed(
        messages.strategyStart('StaleWhileRevalidate', event));
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
   * @return {Promise<Response>}
   *
   * @private
   */
  async _getFromNetwork(event) {
    const response = await fetchWrapper.fetch(
      event.request,
      null,
      this._plugins
    );

    event.waitUntil(
      cacheWrapper.put(
        this._cacheName,
        event.request,
        response.clone(),
        this._plugins
      )
    );

    return response;
  }
}

export {StaleWhileRevalidate};
