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
import './_version.mjs';

/**
 * An implementation of a [cache-first]{@link https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-falling-back-to-network}
 * request strategy.
 *
 * A cache first strategy is useful for assets that have beeng revisioned,
 * such as URLs like `/styles/example.a8f5f1.css`, since they
 * can be cached for long periods of time.
 *
 * @memberof workbox.strategies
 */
class CacheFirst {
  // TODO: Replace `plugins` parameter link with link to d.g.c.

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

    let error;
    if (!response) {
      if (process.env.NODE_ENV !== 'production') {
        logs.push(
          `No response found in the '${this._cacheName}' cache. ` +
          `Will respond with a network request.`);
      }
      try {
        response = await this._getFromNetwork(event);
      } catch (err) {
        error = err;
      }

      if (process.env.NODE_ENV !== 'production') {
        if (response) {
          logs.push(`Got response from network.`);
        } else {
          logs.push(`Unable to get a response from the network.`);
        }
      }
    } else {
      if (process.env.NODE_ENV !== 'production') {
        logs.push(
          `Found a cached response in the '${this._cacheName}' cache.`);
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      logger.groupCollapsed(
        messages.strategyStart('CacheFirst', event));
      for (let log of logs) {
        logger.log(log);
      }
      messages.printFinalResponse(response);
      logger.groupEnd();
    }

    if (error) {
      // Don't swallow error as we'll want it to throw and enable catch
      // handlers in router.
      throw error;
    }

    return response;
  }

  /**
   * Handles the network and cache part of CacheFirst.
   *
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

    // Keep the service worker while we put the request to the cache
    const responseClone = response.clone();
    event.waitUntil(
      cacheWrapper.put(
        this._cacheName,
        event.request,
        responseClone,
        this._plugins
      )
    );

    return response;
  }
}

export {CacheFirst};
