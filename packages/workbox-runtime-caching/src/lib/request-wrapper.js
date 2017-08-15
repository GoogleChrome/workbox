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

import ErrorFactory from './error-factory';
import {isArrayOfType, isType, atLeastOne, isInstance} from
  '../../../../lib/assert';
import {CacheableResponsePlugin} from
  '../../../workbox-cacheable-response/src/index';
import {pluginCallbacks, getDefaultCacheName} from './constants';
import cleanResponseCopy from './clean-response-copy';

/**
 * Called prior to a response being written to the cache. This allows you to
 * prevent the cache from being updated if the response doesn't meet your
 * custom criteria.
 *
 * @example <caption>Determines whether a response is cacheable based on
 * whether its Cache-Control header contains the string 'no-cache'.</caption>
 *
 * async function cacheWillUpdate({response}) {
 *   return !response.headers.get('cache-control').includes('no-cache');
 * }
 *
 * @callback cacheWillUpdate
 * @param {Object} input
 * @param {Request} input.request The original request.
 * @param {Response} input.response The response to the request, based on the
 * configured strategy.
 * @return {Promise<Boolean>} `true` if the response meets your criteria for
 * being added to the appropriate cache, and `false` if it doesn't.
 *
 * @memberof module:workbox-runtime-caching.RequestWrapper
 */

/**
 * Called after a response has been written to the cache.
 *
 * @example <caption>Logs a message when the cache has been updated.</caption>
 *
 * async function cacheDidUpdate({cacheName, url}) {
 *   console.log(`The entry for ${url} in cache ${cacheName} was updated.`);
 * }
 *
 * @callback cacheDidUpdate
 * @param {Object} input
 * @param {String} input.cacheName The name of the cache that was updated.
 * @param {String} input.url The URL used as a key for the cache.
 * @param {Response|null} input.oldResponse The response that was previously in
 * the cache, prior to the update, or `null` if the cache didn't previously
 * contain an entry for `url`.
 * @param {Response|null} input.newResponse The response that was written to
 * the cache.
 *
 * @memberof module:workbox-runtime-caching.RequestWrapper
 */

/**
 * Called before a previously cached response that has been read from the cache
 * is used. This allows you to modify it or return `null` if it's not valid.
 *
 * @example <caption>Returns `null` to indicate that a cached response shouldn't
 * be used if its Date header is too far in the past.</caption>
 *
 * async function cachedResponseWillBeUsed({cachedResponse}) {
 *   if (cachedResponse) {
 *     const dateHeader = cachedResponse.headers.get('date');
 *     const date = new Date(dateHeader);
 *     if (dateHeader && (Date.now() - date.getTime()) < 1000) {
 *       return cachedResponse;
 *     }
 *   }
 *
 *   return null;
 * }
 *
 * @callback cachedResponseWillBeUsed
 * @param {Object} input
 * @param {Request} input.request The original request.
 * @param {Cache} input.cache An open instance of the cache.
 * @param {String} input.cacheName The name corresponding to `cache`.
 * @param {Response|null} input.cachedResponse The response for `request` that's
 * currently in `cache`, or `null` if there isn't currently a response cached.
 * @param {Object} input.matchOptions The
 * [cache match options](https://developer.mozilla.org/en-US/docs/Web/API/Cache/match#Parameters)
 * that were configured when the current `RequestWrapper` was constructed.
 * @return {Promise<Response|null>} The response to be used as the effective
 * cache match. This might be the same response as `cachedResponse`, if it was
 * valid, a modified version of the response, or `null` if there's no valid
 * match.
 *
 * @memberof module:workbox-runtime-caching.RequestWrapper
 */

/**
 * Called prior to a network request being made. This allows you to update the
 * request's URL or headers as appropriate, or just return the original request
 * if there are no modifications needed.
 *
 * @example <caption>Appends a URL parameter to all outgoing requests.</caption>
 *
 * async function requestWillFetch({request}) {
 *   const url = new URL(request.url);
 *   url.searchParams.set('from-workbox', 'true');
 *   return new Request(url.href, {headers: request.headers});
 * }
 *
 * @callback requestWillFetch
 * @param {Object} input
 * @param {Request} input.request The request that would otherwise have been
 * made against the network.
 * @return {Promise<Request>} The request that will be used against the network
 * instead.
 *
 * @memberof module:workbox-runtime-caching.RequestWrapper
 */

/**
 * Called after a network request has failed. This allows you to report the
 * failure, or save a copy of the failed request to be retried later.
 *
 * @example <caption>Logs a message when a network request fails.</caption>
 *
 * async function fetchDidFail({request}) {
 *   const body = await request.text();
 *   console.log(`A request for ${request.url} with body ${body} failed.`);
 * }
 *
 * @callback fetchDidFail
 * @param {Object} input
 * @param {Request} input.request A clone of the request that failed. You can
 * consume the request's body if needed.
 *
 * @memberof module:workbox-runtime-caching.RequestWrapper
 */

/**
 * This class is used by the various subclasses of
 * [Handler]{@link module:workbox-runtime-caching.Handler} to configure the
 * cache name and any desired plugins, which is to say classes that implement
 * request lifecycle callbacks.
 *
 * It automatically triggers any registered callbacks at the appropriate time.
 *
 * @memberof module:workbox-runtime-caching
 */
class RequestWrapper {
  /**
   * Constructor for RequestWrapper.
   * @param {Object} input
   * @param {string} [input.cacheName] The name of the cache to use for Handlers
   *        that involve caching. If none is provided, a default name that
   *        includes the current service worker scope will be used.
   * @param {Array.<Object>} [input.plugins] Any plugins that should be
   *        invoked.
   * @param {Object} [input.fetchOptions] Values passed along to the
   *        [`init`](https://developer.mozilla.org/en-US/docs/Web/API/GlobalFetch/fetch#Parameters)
   *        of all `fetch()` requests made by this wrapper.
   * @param {Object} [input.matchOptions] Values passed along to the
   *        [`options`](https://developer.mozilla.org/en-US/docs/Web/API/Cache/match#Parameters)
   *        of all cache `match()` requests made by this wrapper.
   */
  constructor({cacheName, cacheId, plugins, fetchOptions, matchOptions} = {}) {
    if (cacheId && (typeof cacheId !== 'string' || cacheId.length === 0)) {
      throw ErrorFactory.createError('bad-cache-id');
    }

    if (cacheName) {
      isType({cacheName}, 'string');
      this.cacheName = cacheName;
      if (cacheId) {
        this.cacheName = `${cacheId}-${this.cacheName}`;
      }
    } else {
      this.cacheName = getDefaultCacheName({cacheId});
    }

    if (fetchOptions) {
      isType({fetchOptions}, 'object');
      this.fetchOptions = fetchOptions;
    }

    if (matchOptions) {
      isType({matchOptions}, 'object');
      this.matchOptions = matchOptions;
    }

    this.plugins = new Map();

    if (plugins) {
      isArrayOfType({plugins}, 'object');

      plugins.forEach((plugin) => {
        for (let callbackName of pluginCallbacks) {
          if (typeof plugin[callbackName] === 'function') {
            if (!this.plugins.has(callbackName)) {
              this.plugins.set(callbackName, []);
            } else if (callbackName === 'cacheWillUpdate') {
              throw ErrorFactory.createError(
                'multiple-cache-will-update-plugins');
            } else if (callbackName === 'cachedResponseWillBeUsed') {
              throw ErrorFactory.createError(
                'multiple-cached-response-will-be-used-plugins');
            }
            this.plugins.get(callbackName).push(plugin);
          }
        }
      });
    }

    if (this.plugins.has('cacheWillUpdate')) {
      this._userSpecifiedCachableResponsePlugin =
        this.plugins.get('cacheWillUpdate')[0];
    }
  }


  /**
   * @private
   * @return {function} The default plugin used to determine whether a
   *         response is cacheable.
   */
  getDefaultCacheableResponsePlugin() {
    // Lazy-construct the CacheableResponsePlugin instance.
    if (!this._defaultCacheableResponsePlugin) {
      this._defaultCacheableResponsePlugin =
        new CacheableResponsePlugin({statuses: [200]});
    }
    return this._defaultCacheableResponsePlugin;
  }

  /**
   * Opens a cache and maintains a reference to that cache
   * for future use.
   *
   * @example
   * requestWrapper.getCache()
   * .then((openCache) => {
   *    ...
   * });
   *
   * @return {Promise<Cache>} An open `Cache` instance based on the configured
   * `cacheName`.
   */
  async getCache() {
    if (!this._cache) {
      this._cache = await caches.open(this.cacheName);
    }
    return this._cache;
  }

  /**
   * Wraps `cache.match()`, using the previously configured cache name and match
   * options.
   *
   * @example
   * requestWrapper.match({event.request})
   * .then((response) => {
   *   if (!response) {
   *     // No response in cache.
   *     return;
   *   }
   *   ...
   * });
   *
   * @param {Object} input
   * @param {Request|string} input.request The key for the cache lookup.
   * @return {Promise.<Response>} The cached response.
   */
  async match({request}) {
    atLeastOne({request});

    const cache = await this.getCache();
    let cachedResponse = await cache.match(request, this.matchOptions);

    if (this.plugins.has('cachedResponseWillBeUsed')) {
      const plugin = this.plugins.get('cachedResponseWillBeUsed')[0];
      cachedResponse = await plugin.cachedResponseWillBeUsed({
        request, cache, cachedResponse,
        matchOptions: this.matchOptions, cacheName: this.cacheName,
      });
    }

    return cachedResponse;
  }

  /**
   * Wraps `fetch()`, calls all `requestWillFetch` before making the network
   * request, and calls any `fetchDidFail` callbacks from the
   * registered plugins if the request fails.
   *
   * @example
   * requestWrapper.fetch({
   *   request: event.request
   * })
   * .then((response) => {
   *  ...
   * })
   * .catch((err) => {
   *   ...
   * });
   *
   * @param {Object} input
   * @param {Request|string} input.request The request or URL to be fetched.
   * @return {Promise.<Response>} The network response.
   */
  async fetch({request}) {
    if (typeof request === 'string') {
      request = new Request(request);
    } else {
      isInstance({request}, Request);
    }

    // If there is a fetchDidFail plugin, we need to save a clone of the
    // original request before it's either modified by a requestWillFetch
    // plugin or before the original request's body is consumed via fetch().
    const clonedRequest = this.plugins.has('fetchDidFail') ?
      request.clone() : null;

    if (this.plugins.has('requestWillFetch')) {
      for (let plugin of this.plugins.get('requestWillFetch')) {
        const returnedRequest = await plugin.requestWillFetch({request});
        isInstance({returnedRequest}, Request);
        request = returnedRequest;
      }
    }

    try {
      return await fetch(request, this.fetchOptions);
    } catch (err) {
      if (this.plugins.has('fetchDidFail')) {
        for (let plugin of this.plugins.get('fetchDidFail')) {
          await plugin.fetchDidFail({request: clonedRequest.clone()});
        }
      }

      throw err;
    }
  }

  /**
   * Combines both fetching and caching using the previously configured options
   * and calling the appropriate plugins.
   *
   * By default, responses with a status of [2xx](https://fetch.spec.whatwg.org/#ok-status)
   * will be considered valid and cacheable, but this could be overridden by
   * configuring one or more plugins that implement the `cacheWillUpdate`
   * lifecycle callback.
   *
   * @example
   * requestWrapper.fetchAndCache({
   *   request: event.request
   * })
   * .then((response) => {
   *  ...
   * })
   * .catch((err) => {
   *   ...
   * });
   *
   * @param {Object} input
   * @param {Request} input.request The request to fetch.
   * @param {boolean} [input.waitOnCache] `true` means the method should wait
   *        for the cache.put() to complete before returning. The default value
   *        of `false` means return without waiting. It this value is true
   *        and the response can't be cached, an error will be thrown.
   * @param {Request} [input.cacheKey] Supply a cacheKey if you wish to cache
   *        the response against an alternative request to the `request`
   *        argument.
   * @param {function} [input.cacheResponsePlugin] Allows the
   *        caller to override the default check for cacheability, for
   *        situations in which the cacheability check wasn't explicitly
   *        configured when constructing the `RequestWrapper`.
   * @param {boolean} [input.cleanRedirects] If true, a "clean" copy of any
   * redirected responses will be added to the cache, since redirected responses
   * [can't be used](https://bugs.chromium.org/p/chromium/issues/detail?id=669363&desc=2#c1)
   * to satisfy navigation requests. Defaults to false.
   * @return {Promise.<Response>} The network response.
   */
  async fetchAndCache(
    {request, waitOnCache, cacheKey, cacheResponsePlugin, cleanRedirects}) {
    atLeastOne({request});

    let cachingComplete;
    const response = await this.fetch({request});

    // We need flexibility in determining whether a given response should
    // be added to the cache. There are several possible ways that this logic
    // might be specified, and they're given the following precedence:
    // 1. Passing in a `CacheableResponsePlugin` to the `RequestWrapper`
    //    constructor, which sets this._userSpecifiedCachableResponsePlugin.
    // 2. Passing in a parameter to the fetchAndCache() method (done by certain
    //    runtime handlers, like `StaleWhileRevalidate`), which sets
    //    cacheResponsePlugin.
    // 3. The default that applies to anything using the `RequestWrapper` class
    //    that doesn't specify the custom behavior, which is accessed via
    //    the this.getDefaultCacheableResponsePlugin().
    const effectiveCacheableResponsePlugin =
      this._userSpecifiedCachableResponsePlugin ||
      cacheResponsePlugin ||
      this.getDefaultCacheableResponsePlugin();

    // Whichever plugin we've decided is appropriate, we now call its
    // cacheWillUpdate() method to determine cacheability of the response.
    const cacheable = await effectiveCacheableResponsePlugin.cacheWillUpdate(
      {request, response});

    if (cacheable) {
      // If cleanRedirects is set and this is a redirected response, then
      // get a "clean" copy to add to the cache.
      const newResponse = cleanRedirects && response.redirected ?
        await cleanResponseCopy({response}) :
        response.clone();

      // cachingComplete is a promise that may or may not be used to delay the
      // completion of this method, depending on the value of `waitOnCache`.
      cachingComplete = this.getCache().then(async (cache) => {
        let oldResponse;
        const cacheRequest = cacheKey || request;

        // Only bother getting the old response if the new response isn't opaque
        // and there's at least one cacheDidUpdate plugin. Otherwise, we don't
        // need it.
        if (response.type !== 'opaque' &&
          this.plugins.has('cacheDidUpdate')) {
          oldResponse = await this.match({request: cacheRequest});
        }

        // Regardless of whether or not we'll end up invoking
        // cacheDidUpdate, wait until the cache is updated.
        await cache.put(cacheRequest, newResponse);

        if (this.plugins.has('cacheDidUpdate')) {
          for (let plugin of this.plugins.get('cacheDidUpdate')) {
            await plugin.cacheDidUpdate({
              cacheName: this.cacheName,
              oldResponse,
              newResponse,
              // cacheRequest may be a Request with a url property, or a string.
              url: ('url' in cacheRequest) ? cacheRequest.url : cacheRequest,
            });
          }
        }
      });
    } else if (!cacheable && waitOnCache) {
      // If the developer requested to wait on the cache but the response
      // isn't cacheable, throw an error.
      throw ErrorFactory.createError('invalid-response-for-caching');
    }

    // Only conditionally await the caching completion, giving developers the
    // option of returning early for, e.g., read-through-caching scenarios.
    if (waitOnCache && cachingComplete) {
      await cachingComplete;
    }

    return response;
  }
}

export default RequestWrapper;
