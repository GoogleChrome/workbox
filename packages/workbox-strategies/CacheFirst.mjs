/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert.mjs';
import {cacheNames} from 'workbox-core/_private/cacheNames.mjs';
import {cacheWrapper} from 'workbox-core/_private/cacheWrapper.mjs';
import {fetchWrapper} from 'workbox-core/_private/fetchWrapper.mjs';
import {getFriendlyURL} from 'workbox-core/_private/getFriendlyURL.mjs';
import {logger} from 'workbox-core/_private/logger.mjs';
import {WorkboxError} from 'workbox-core/_private/WorkboxError.mjs';

import {messages} from './utils/messages.mjs';
import './_version.mjs';

/**
 * An implementation of a [cache-first]{@link https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-falling-back-to-network}
 * request strategy.
 *
 * A cache first strategy is useful for assets that have been revisioned,
 * such as URLs like `/styles/example.a8f5f1.css`, since they
 * can be cached for long periods of time.
 *
 * If the network request fails, and there is no cache match, this will throw
 * a `WorkboxError` exception.
 *
 * @memberof workbox.strategies
 */
class CacheFirst {
  /**
   * @param {Object} options
   * @param {string} options.cacheName Cache name to store and retrieve
   * requests. Defaults to cache names provided by
   * [workbox-core]{@link workbox.core.cacheNames}.
   * @param {Array<Object>} options.plugins [Plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}
   * to use in conjunction with this caching strategy.
   * @param {Object} options.fetchOptions Values passed along to the
   * [`init`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters)
   * of all fetch() requests made by this strategy.
   * @param {Object} options.matchOptions [`CacheQueryOptions`](https://w3c.github.io/ServiceWorker/#dictdef-cachequeryoptions)
   */
  constructor(options = {}) {
    this._cacheName = cacheNames.getRuntimeName(options.cacheName);
    this._plugins = options.plugins || [];
    this._fetchOptions = options.fetchOptions || null;
    this._matchOptions = options.matchOptions || null;
  }

  /**
   * This method will perform a request strategy and follows an API that
   * will work with the
   * [Workbox Router]{@link workbox.routing.Router}.
   *
   * @param {Object} options
   * @param {Request} options.request The request to run this strategy for.
   * @param {Event} [options.event] The event that triggered the request.
   * @return {Promise<Response>}
   */
  async handle({event, request}) {
    return this.makeRequest({
      event,
      request: request || event.request,
    });
  }

  /**
   * This method can be used to perform a make a standalone request outside the
   * context of the [Workbox Router]{@link workbox.routing.Router}.
   *
   * See "[Advanced Recipes](https://developers.google.com/web/tools/workbox/guides/advanced-recipes#make-requests)"
   * for more usage information.
   *
   * @param {Object} options
   * @param {Request|string} options.request Either a
   *     [`Request`]{@link https://developer.mozilla.org/en-US/docs/Web/API/Request}
   *     object, or a string URL, corresponding to the request to be made.
   * @param {FetchEvent} [options.event] If provided, `event.waitUntil()` will
         be called automatically to extend the service worker's lifetime.
   * @return {Promise<Response>}
   */
  async makeRequest({event, request}) {
    const logs = [];

    if (typeof request === 'string') {
      request = new Request(request);
    }

    if (process.env.NODE_ENV !== 'production') {
      assert.isInstance(request, Request, {
        moduleName: 'workbox-strategies',
        className: 'CacheFirst',
        funcName: 'makeRequest',
        paramName: 'request',
      });
    }

    let response = await cacheWrapper.match({
      cacheName: this._cacheName,
      request,
      event,
      matchOptions: this._matchOptions,
      plugins: this._plugins,
    });

    let error;
    if (!response) {
      if (process.env.NODE_ENV !== 'production') {
        logs.push(
            `No response found in the '${this._cacheName}' cache. ` +
          `Will respond with a network request.`);
      }
      try {
        response = await this._getFromNetwork(request, event);
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
          messages.strategyStart('CacheFirst', request));
      for (let log of logs) {
        logger.log(log);
      }
      messages.printFinalResponse(response);
      logger.groupEnd();
    }

    if (!response) {
      throw new WorkboxError('no-response', {url: request.url, error});
    }
    return response;
  }

  /**
   * Handles the network and cache part of CacheFirst.
   *
   * @param {Request} request
   * @param {FetchEvent} [event]
   * @return {Promise<Response>}
   *
   * @private
   */
  async _getFromNetwork(request, event) {
    const response = await fetchWrapper.fetch({
      request,
      event,
      fetchOptions: this._fetchOptions,
      plugins: this._plugins,
    });

    // Keep the service worker while we put the request to the cache
    const responseClone = response.clone();
    const cachePutPromise = cacheWrapper.put({
      cacheName: this._cacheName,
      request,
      response: responseClone,
      event,
      plugins: this._plugins,
    });

    if (event) {
      try {
        event.waitUntil(cachePutPromise);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          logger.warn(`Unable to ensure service worker stays alive when ` +
            `updating cache for '${getFriendlyURL(request.url)}'.`);
        }
      }
    }

    return response;
  }
}

export {CacheFirst};
