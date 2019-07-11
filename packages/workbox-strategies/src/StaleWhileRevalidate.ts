/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert.js';
import {cacheNames} from 'workbox-core/_private/cacheNames.js';
import {cacheWrapper} from 'workbox-core/_private/cacheWrapper.js';
import {fetchWrapper} from 'workbox-core/_private/fetchWrapper.js';
import {getFriendlyURL} from 'workbox-core/_private/getFriendlyURL.js';
import {logger} from 'workbox-core/_private/logger.js';
import {WorkboxError} from 'workbox-core/_private/WorkboxError.js';
import {RouteHandler, RouteHandlerCallbackOptions, WorkboxPlugin} from 'workbox-core/types.js';
import {messages} from './utils/messages.js';
import {cacheOkAndOpaquePlugin} from './plugins/cacheOkAndOpaquePlugin.js';
import './_version.js';


interface StaleWhileRevalidateOptions {
  cacheName?: string;
  plugins?: WorkboxPlugin[];
  fetchOptions?: RequestInit;
  matchOptions?: CacheQueryOptions;
}

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
 * If the network request fails, and there is no cache match, this will throw
 * a `WorkboxError` exception.
 *
 * @memberof workbox.strategies
 */
class StaleWhileRevalidate implements RouteHandler {
  private _cacheName: string;
  private _plugins: WorkboxPlugin[];
  private _fetchOptions?: RequestInit;
  private _matchOptions?: CacheQueryOptions;

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
  constructor(options: StaleWhileRevalidateOptions = {}) {
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

    this._fetchOptions = options.fetchOptions;
    this._matchOptions = options.matchOptions;
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
  async handle({event, request}: RouteHandlerCallbackOptions): Promise<Response> {
    return this.makeRequest({
      event,
      request: request || (event as FetchEvent).request,
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
  async makeRequest({event, request}: {
    request: Request,
    event?: ExtendableEvent
  }): Promise<Response> {
   const logs = [];

    if (typeof request === 'string') {
      request = new Request(request);
    }

    if (process.env.NODE_ENV !== 'production') {
      assert!.isInstance(request, Request, {
        moduleName: 'workbox-strategies',
        className: 'StaleWhileRevalidate',
        funcName: 'handle',
        paramName: 'request',
      });
    }

    const fetchAndCachePromise = this._getFromNetwork({request, event});

    let response = await cacheWrapper.match({
      cacheName: this._cacheName,
      request,
      event,
      matchOptions: this._matchOptions,
      plugins: this._plugins,
    });
    let error;
    if (response) {
      if (process.env.NODE_ENV !== 'production') {
        logs.push(`Found a cached response in the '${this._cacheName}'` +
          ` cache. Will update with the network response in the background.`);
      }

      if (event) {
        try {
          event.waitUntil(fetchAndCachePromise);
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            logger.warn(`Unable to ensure service worker stays alive when ` +
              `updating cache for '${getFriendlyURL(request.url)}'.`);
          }
        }
      }
    } else {
      if (process.env.NODE_ENV !== 'production') {
        logs.push(`No response found in the '${this._cacheName}' cache. ` +
          `Will wait for the network response.`);
      }
      try {
        response = await fetchAndCachePromise;
      } catch (err) {
        error = err;
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      logger.groupCollapsed(
          messages.strategyStart('StaleWhileRevalidate', request));
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
   * @param {Object} options
   * @param {Request} options.request
   * @param {Event} [options.event]
   * @return {Promise<Response>}
   *
   * @private
   */
  async _getFromNetwork({request, event}: {
    request: Request,
    event?: ExtendableEvent,
  }): Promise<Response> {
    const response = await fetchWrapper.fetch({
      request,
      event,
      fetchOptions: this._fetchOptions,
      plugins: this._plugins,
    });

    const cachePutPromise = cacheWrapper.put({
      cacheName: this._cacheName,
      request,
      response: response.clone(),
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

export {StaleWhileRevalidate};
