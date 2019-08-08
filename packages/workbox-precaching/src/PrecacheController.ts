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
import {logger} from 'workbox-core/_private/logger.js';
import {RouteHandlerCallback} from 'workbox-core/types.js';
import {WorkboxError} from 'workbox-core/_private/WorkboxError.js';
import {WorkboxPlugin} from 'workbox-core/types.js';

import {PrecacheEntry} from './_types.js';
import {cleanRedirect} from './utils/cleanRedirect.js';
import {createCacheKey} from './utils/createCacheKey.js';
import {printCleanupDetails} from './utils/printCleanupDetails.js';
import {printInstallDetails} from './utils/printInstallDetails.js';

import './_version.js';
 
/**
 * Performs efficient precaching of assets.
 *
 * @memberof module:workbox-precaching
 */
class PrecacheController {
  private _cacheName: string;
  private _urlsToCacheKeys: Map<string, string>;
  private _cacheKeysToIntegrities: Map<string, string>;

  /**
   * Create a new PrecacheController.
   *
   * @param {string} [cacheName] An optional name for the cache, to override
   * the default precache name.
   */
  constructor(cacheName?: string) {
    this._cacheName = cacheNames.getPrecacheName(cacheName);
    this._urlsToCacheKeys = new Map();
    this._cacheKeysToIntegrities = new Map();
  }

  /**
   * This method will add items to the precache list, removing duplicates
   * and ensuring the information is valid.
   *
   * @param {
   * Array<module:workbox-precaching.PrecacheController.PrecacheEntry|string>
   * } entries Array of entries to precache.
   */
  addToCacheList(entries: Array<PrecacheEntry|string>) {
    if (process.env.NODE_ENV !== 'production') {
      assert!.isArray(entries, {
        moduleName: 'workbox-precaching',
        className: 'PrecacheController',
        funcName: 'addToCacheList',
        paramName: 'entries',
      });
    }

    for (const entry of entries) {
      const {cacheKey, url} = createCacheKey(entry);

      if (this._urlsToCacheKeys.has(url) &&
          this._urlsToCacheKeys.get(url) !== cacheKey) {
        throw new WorkboxError('add-to-cache-list-conflicting-entries', {
          firstEntry: this._urlsToCacheKeys.get(url),
          secondEntry: cacheKey,
        });
      }

      if (typeof entry !== 'string' && entry.integrity) {
        if (this._cacheKeysToIntegrities.has(cacheKey) &&
            this._cacheKeysToIntegrities.get(cacheKey) !== entry.integrity) {
          throw new WorkboxError('add-to-cache-list-conflicting-integrities', {
            url,
          });
        }
        this._cacheKeysToIntegrities.set(cacheKey, entry.integrity);
      }

      this._urlsToCacheKeys.set(url, cacheKey);
    }
  }

  /**
   * Precaches new and updated assets. Call this method from the service worker
   * install event.
   *
   * @param {Object} options
   * @param {Event} [options.event] The install event (if needed).
   * @param {Array<Object>} [options.plugins] Plugins to be used for fetching
   * and caching during install.
   * @return {Promise<workbox.precaching.InstallResult>}
   */
  async install({event, plugins}: {
    event?: ExtendableEvent,
    plugins?: WorkboxPlugin[],
  } = {}) {
    if (process.env.NODE_ENV !== 'production') {
      if (plugins) {
        assert!.isArray(plugins, {
          moduleName: 'workbox-precaching',
          className: 'PrecacheController',
          funcName: 'install',
          paramName: 'plugins',
        });
      }
    }

    const toBePrecached: {cacheKey: string, url: string}[] = [];
    const alreadyPrecached: string[] = [];

    const cache = await caches.open(this._cacheName);
    const alreadyCachedRequests = await cache.keys();
    const existingCacheKeys = new Set(alreadyCachedRequests.map(
        (request) => request.url));

    for (const [url, cacheKey] of this._urlsToCacheKeys) {
      if (existingCacheKeys.has(cacheKey)) {
        alreadyPrecached.push(url);
      } else {
        toBePrecached.push({cacheKey, url});
      }
    }

    const precacheRequests = toBePrecached.map(({cacheKey, url}) => {
      const integrity = this._cacheKeysToIntegrities.get(cacheKey);
      return this._addURLToCache({cacheKey, event, plugins, url, integrity});
    });
    await Promise.all(precacheRequests);

    const updatedURLs = toBePrecached.map((item) => item.url);

    if (process.env.NODE_ENV !== 'production') {
      printInstallDetails(updatedURLs, alreadyPrecached);
    }

    return {
      updatedURLs,
      notUpdatedURLs: alreadyPrecached,
    };
  }

  /**
   * Deletes assets that are no longer present in the current precache manifest.
   * Call this method from the service worker activate event.
   *
   * @return {Promise<workbox.precaching.CleanupResult>}
   */
  async activate() {
    const cache = await caches.open(this._cacheName);
    const currentlyCachedRequests = await cache.keys();
    const expectedCacheKeys = new Set(this._urlsToCacheKeys.values());

    const deletedURLs = [];
    for (const request of currentlyCachedRequests) {
      if (!expectedCacheKeys.has(request.url)) {
        await cache.delete(request);
        deletedURLs.push(request.url);
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      printCleanupDetails(deletedURLs);
    }

    return {deletedURLs};
  }

  /**
   * Requests the entry and saves it to the cache if the response is valid.
   * By default, any response with a status code of less than 400 (including
   * opaque responses) is considered valid.
   *
   * If you need to use custom criteria to determine what's valid and what
   * isn't, then pass in an item in `options.plugins` that implements the
   * `cacheWillUpdate()` lifecycle event.
   *
   * @private
   * @param {Object} options
   * @param {string} options.cacheKey The string to use a cache key.
   * @param {string} options.url The URL to fetch and cache.
   * @param {Event} [options.event] The install event (if passed).
   * @param {Array<Object>} [options.plugins] An array of plugins to apply to
   * fetch and caching.
   * @param {string} [options.integrity] The value to use for the `integrity`
   * field when making the request.
   */
  async _addURLToCache({cacheKey, url, event, plugins, integrity}: {
    cacheKey: string,
    url: string,
    event?: ExtendableEvent,
    plugins?: WorkboxPlugin[],
    integrity?: string,
  }) {
    const request = new Request(url, {
      integrity,
      cache: 'reload',
      credentials: 'same-origin',
    });

    let response = await fetchWrapper.fetch({
      event,
      plugins,
      request,
    });

    // Allow developers to override the default logic about what is and isn't
    // valid by passing in a plugin implementing cacheWillUpdate(), e.g.
    // a workbox.cacheableResponse.Plugin instance.
    let cacheWillUpdatePlugin;
    for (const plugin of (plugins || [])) {
      if ('cacheWillUpdate' in plugin) {
        cacheWillUpdatePlugin = plugin;
      }
    }

    const isValidResponse = cacheWillUpdatePlugin ?
      // Use a callback if provided. It returns a truthy value if valid.
      // NOTE: invoke the method on the plugin instance so the `this` context
      // is correct.
      cacheWillUpdatePlugin.cacheWillUpdate!({event, request, response}) :
      // Otherwise, default to considering any response status under 400 valid.
      // This includes, by default, considering opaque responses valid.
      response.status < 400;

    // Consider this a failure, leading to the `install` handler failing, if
    // we get back an invalid response.
    if (!isValidResponse) {
      throw new WorkboxError('bad-precaching-response', {
        url,
        status: response.status,
      });
    }

    if (response.redirected) {
      response = await cleanRedirect(response);
    }

    await cacheWrapper.put({
      event,
      plugins,
      response,
      // `request` already uses `url`. We may be able to reuse it.
      request: cacheKey === url ? request : new Request(cacheKey),
      cacheName: this._cacheName,
      matchOptions: {
        ignoreSearch: true,
      },
    });
  }

  /**
   * Returns a mapping of a precached URL to the corresponding cache key, taking
   * into account the revision information for the URL.
   *
   * @return {Map<string, string>} A URL to cache key mapping.
   */
  getURLsToCacheKeys() {
    return this._urlsToCacheKeys;
  }

  /**
   * Returns a list of all the URLs that have been precached by the current
   * service worker.
   *
   * @return {Array<string>} The precached URLs.
   */
  getCachedURLs() {
    return [...this._urlsToCacheKeys.keys()];
  }

  /**
   * Returns the cache key used for storing a given URL. If that URL is
   * unversioned, like `/index.html', then the cache key will be the original
   * URL with a search parameter appended to it.
   *
   * @param {string} url A URL whose cache key you want to look up.
   * @return {string} The versioned URL that corresponds to a cache key
   * for the original URL, or undefined if that URL isn't precached.
   */
  getCacheKeyForURL(url: string) {
    const urlObject = new URL(url, location.href);
    return this._urlsToCacheKeys.get(urlObject.href);
  }

  /**
   * Returns a function that looks up `url` in the precache (taking into
   * account revision information), and returns the corresponding `Response`.
   * 
   * If for an unexpected reason there is a cache miss when looking up `url`,
   * this will fall back to retrieving the `Response` via `fetch()`.
   *
   * @param {string} url The precached URL which will be used to lookup the
   * `Response`.
   * @return {workbox.routing.Route~handlerCallback}
   */
  createHandlerForURL(url: string): RouteHandlerCallback {
    if (process.env.NODE_ENV !== 'production') {
      assert!.isType(url, 'string', {
        moduleName: 'workbox-precaching',
        funcName: 'createHandlerForURL',
        paramName: 'url',
      });
    }
  
    const cacheKey = this.getCacheKeyForURL(url);
    if (!cacheKey) {
      throw new WorkboxError('non-precached-url', {url});
    }
  
    return async () => {
      try {
        const cache = await caches.open(this._cacheName);
        const response = await cache.match(cacheKey);
  
        if (response) {
          return response;
        }
  
        // This shouldn't normally happen, but there are edge cases:
        // https://github.com/GoogleChrome/workbox/issues/1441
        throw new Error(`The cache ${this._cacheName} did not have an entry ` +
            `for ${cacheKey}.`);
      } catch (error) {
        // If there's either a cache miss, or the caches.match() call threw
        // an exception, then attempt to fulfill the navigation request with
        // a response from the network rather than leaving the user with a
        // failed navigation.
        if (process.env.NODE_ENV !== 'production') {
          logger.debug(`Unable to respond to navigation request with ` +
              `cached response. Falling back to network.`, error);
        }
  
        // This might still fail if the browser is offline...
        return fetch(cacheKey);
      }
    };
  };
}

export {PrecacheController};
