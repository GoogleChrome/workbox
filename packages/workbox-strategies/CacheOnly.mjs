/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert.mjs';
import {cacheNames} from 'workbox-core/_private/cacheNames.mjs';
import {cacheWrapper} from 'workbox-core/_private/cacheWrapper.mjs';
import {logger} from 'workbox-core/_private/logger.mjs';
import {WorkboxError} from 'workbox-core/_private/WorkboxError.mjs';

import {messages} from './utils/messages.mjs';
import './_version.mjs';


/**
 * An implementation of a
 * [cache-only]{@link https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-only}
 * request strategy.
 *
 * This class is useful if you want to take advantage of any
 * [Workbox plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}.
 *
 * If there is no cache match, this will throw a `WorkboxError` exception.
 *
 * @memberof workbox.strategies
 */
class CacheOnly {
  /**
   * @param {Object} options
   * @param {string} options.cacheName Cache name to store and retrieve
   * requests. Defaults to cache names provided by
   * [workbox-core]{@link workbox.core.cacheNames}.
   * @param {Array<Object>} options.plugins [Plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}
   * to use in conjunction with this caching strategy.
   * @param {Object} options.matchOptions [`CacheQueryOptions`](https://w3c.github.io/ServiceWorker/#dictdef-cachequeryoptions)
   */
  constructor(options = {}) {
    this._cacheName = cacheNames.getRuntimeName(options.cacheName);
    this._plugins = options.plugins || [];
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
   *     be called automatically to extend the service worker's lifetime.
   * @return {Promise<Response>}
   */
  async makeRequest({event, request}) {
    if (typeof request === 'string') {
      request = new Request(request);
    }

    if (process.env.NODE_ENV !== 'production') {
      assert.isInstance(request, Request, {
        moduleName: 'workbox-strategies',
        className: 'CacheOnly',
        funcName: 'makeRequest',
        paramName: 'request',
      });
    }

    const response = await cacheWrapper.match({
      cacheName: this._cacheName,
      request,
      event,
      matchOptions: this._matchOptions,
      plugins: this._plugins,
    });

    if (process.env.NODE_ENV !== 'production') {
      logger.groupCollapsed(
          messages.strategyStart('CacheOnly', request));
      if (response) {
        logger.log(`Found a cached response in the '${this._cacheName}'` +
          ` cache.`);
        messages.printFinalResponse(response);
      } else {
        logger.log(`No response found in the '${this._cacheName}' cache.`);
      }
      logger.groupEnd();
    }

    if (!response) {
      throw new WorkboxError('no-response', {url: request.url});
    }
    return response;
  }
}

export {CacheOnly};
