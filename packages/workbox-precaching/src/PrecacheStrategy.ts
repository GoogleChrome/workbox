/*
  Copyright 2020 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {copyResponse} from 'workbox-core/copyResponse.js';
import {cacheNames} from 'workbox-core/_private/cacheNames.js';
import {getFriendlyURL} from 'workbox-core/_private/getFriendlyURL.js';
import {logger} from 'workbox-core/_private/logger.js';
import {WorkboxError} from 'workbox-core/_private/WorkboxError.js';
import {WorkboxPlugin} from 'workbox-core/types.js';
import {Strategy, StrategyOptions} from 'workbox-strategies/Strategy.js';
import {StrategyHandler} from 'workbox-strategies/StrategyHandler.js';

import './_version.js';


const copyRedirectedCacheableResponsesPlugin: WorkboxPlugin = {
  async cacheWillUpdate({response}) {
    return response.redirected ? await copyResponse(response) : response;
  }
}

interface PrecacheStrategyOptions extends StrategyOptions {
  fallbackToNetwork?: boolean;
}

/**
 * A [Strategy]{@link module:workbox-strategies.Strategy} implementation
 * specifically designed to work with
 * [PrecacheController]{@link module:workbox-precaching.PrecacheController}
 * to both cache and fetch precached assets.
 *
 * Note: an instance of this class is created automatically when creating a
 * `PrecacheController`; it's generally not necessary to create this yourself.
 *
 * @extends module:workbox-strategies.Strategy
 * @memberof module:workbox-precaching
 */
class PrecacheStrategy extends Strategy {
  private readonly _fallbackToNetwork: boolean;

  /**
   *
   * @param {Object} [options]
   * @param {string} [options.cacheName] Cache name to store and retrieve
   * requests. Defaults to the cache names provided by
   * [workbox-core]{@link module:workbox-core.cacheNames}.
   * @param {Array<Object>} [options.plugins] [Plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}
   * to use in conjunction with this caching strategy.
   * @param {Object} [options.fetchOptions] Values passed along to the
   * [`init`]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters}
   * of all fetch() requests made by this strategy.
   * @param {Object} [options.matchOptions] The
   * [`CacheQueryOptions`]{@link https://w3c.github.io/ServiceWorker/#dictdef-cachequeryoptions}
   * for any `cache.match()` or `cache.put()` calls made by this strategy.
   * @param {boolean} [options.fallbackToNetwork=true] Whether to attempt to
   * get the response from the network if there's a precache miss.
   */
  constructor(options: PrecacheStrategyOptions = {}) {
    options.cacheName = cacheNames.getPrecacheName(options.cacheName);
    super(options);

    this._fallbackToNetwork = options.fallbackToNetwork === false ? false: true;

    // Redirected responses cannot be used to satisfy a navigation request, so
    // any redirected response must be "copied" rather than cloned, so the new
    // response doesn't contain the `redirected` flag. See:
    // https://bugs.chromium.org/p/chromium/issues/detail?id=669363&desc=2#c1
    this.plugins.push(copyRedirectedCacheableResponsesPlugin);
  }

  /**
   * @private
   * @param {Request|string} request A request to run this strategy for.
   * @param {module:workbox-strategies.StrategyHandler} handler The event that
   *     triggered the request.
   * @return {Promise<Response>}
   */
  async _handle(request: Request, handler: StrategyHandler) {
    const response = await handler.cacheMatch(request);
    if (!response) {
      // If this is an `install` event then populate the cache. If this is a
      // `fetch` event (or any other event) then respond with the cached
      // response.
      if (handler.event && handler.event.type === 'install') {
        return await this._handleInstall(request, handler);
      }
      return await this._handleFetch(request, handler);
    }

    return response;
  }

  async _handleFetch(request: Request, handler: StrategyHandler) {
    let response;

    // Fall back to the network if we don't have a cached response
    // (perhaps due to manual cache cleanup).
    if (this._fallbackToNetwork) {
      if (process.env.NODE_ENV !== 'production') {
        logger.warn(`The precached response for ` +
            `${getFriendlyURL(request.url)} in ${this.cacheName} was not ` +
            `found. Falling back to the network instead.`);
      }
      response = await handler.fetch(request);
    } else {
      // This shouldn't normally happen, but there are edge cases:
      // https://github.com/GoogleChrome/workbox/issues/1441
      throw new WorkboxError('missing-precache-entry', {
        cacheName: this.cacheName,
        url: request.url,
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      const cacheKey = handler.params && handler.params.cacheKey ||
          await handler.getCacheKey(request, 'read');

      // Workbox is going to handle the route.
      // print the routing details to the console.
      logger.groupCollapsed(`Precaching is responding to: ` +
          getFriendlyURL(request.url));
      logger.log(`Serving the precached url: ${getFriendlyURL(cacheKey.url)}`);

      logger.groupCollapsed(`View request details here.`);
      logger.log(request);
      logger.groupEnd();

      logger.groupCollapsed(`View response details here.`);
      logger.log(response);
      logger.groupEnd();

      logger.groupEnd();
    }
    return response;
  }

  async _handleInstall(request: Request, handler: StrategyHandler) {
    const response = await handler.fetchAndCachePut(request);

    // Any time there's no response, consider it a precaching error.
    let responseSafeToPrecache = Boolean(response);

    // Also consider it an error if the user didn't pass their own
    // cacheWillUpdate plugin, and the response is a 400+ (note: this means
    // that by default opaque responses can be precached).
    if (response && response.status >= 400 &&
        !this._usesCustomCacheableResponseLogic()) {
      responseSafeToPrecache = false;
    }

    if (!responseSafeToPrecache) {
      // Throwing here will lead to the `install` handler failing, which
      // we want to do if *any* of the responses aren't safe to cache.
      throw new WorkboxError('bad-precaching-response', {
        url: request.url,
        status: response.status,
      });
    }

    return response;
  }

  /**
   * Returns true if any users plugins were added containing their own
   * `cacheWillUpdate` callback.
   *
   * This method indicates whether the default cacheable response logic (i.e.
   * <400, including opaque responses) should be used. If a custom plugin
   * with a `cacheWillUpdate` callback is passed, then the strategy should
   * defer to that plugin's logic.
   *
   * @private
   */
  _usesCustomCacheableResponseLogic(): boolean {
    return this.plugins.some((plugin) => plugin.cacheWillUpdate &&
        plugin !== copyRedirectedCacheableResponsesPlugin);
  }
}

export {PrecacheStrategy};
