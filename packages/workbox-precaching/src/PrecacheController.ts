/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert.js';
import {cacheNames} from 'workbox-core/_private/cacheNames.js';
import {getFriendlyURL} from 'workbox-core/_private/getFriendlyURL.js';
import {logger} from 'workbox-core/_private/logger.js';
import {WorkboxError} from 'workbox-core/_private/WorkboxError.js';
import {RouteMatchCallbackOptions, RouteHandlerCallback, RouteHandlerCallbackOptions, WorkboxPlugin} from 'workbox-core/types.js';

import {Route} from 'workbox-routing/Route.js';
import {Router} from 'workbox-routing/Router.js';
import {Strategy} from 'workbox-strategies/Strategy.js';

import {createCacheKey} from './utils/createCacheKey.js';
import {PrecacheStrategy} from './utils/PrecacheStrategy.js';
import {printCleanupDetails} from './utils/printCleanupDetails.js';
import {printInstallDetails} from './utils/printInstallDetails.js';
import {generateURLVariations} from './utils/generateURLVariations.js';
import {PrecacheEntry, FetchListenerOptions} from './_types.js';
import './_version.js';


// Give TypeScript the correct global.
declare let self: ServiceWorkerGlobalScope;

declare global {
  interface WorkerGlobalScope {
    __WB_MANIFEST: Array<PrecacheEntry|string>;
  }
}

/**
 * Performs efficient precaching of assets.
 *
 * @memberof module:workbox-precaching
 */
class PrecacheController {
  private readonly _cacheName: string;
  private readonly _urlsToCacheKeys: Map<string, string>;
  private readonly _urlsToCacheModes: Map<string, "reload" | "default" | "no-store" | "no-cache" | "force-cache" | "only-if-cached">;
  private readonly _cacheKeysToIntegrities: Map<string, string>;

  private _router?: Router;
  private _strategy?: Strategy;
  private _installed?: boolean = false;
  private readonly _cacheKeyPlugin: WorkboxPlugin;
  private readonly _plugins: WorkboxPlugin[] = [];

  /**
   * Create a new PrecacheController.
   *
   * @param {string} [cacheName] An optional name for the cache, to override
   * the default precache name.
   */
  constructor(cacheName?: string) {
    this._cacheName = cacheNames.getPrecacheName(cacheName);
    this._urlsToCacheKeys = new Map();
    this._urlsToCacheModes = new Map();
    this._cacheKeysToIntegrities = new Map();

    this._cacheKeyPlugin = {
      cacheKeyWillBeUsed: async ({request, params}: {request: Request; params?: any}) => {
        const cacheKey = params && params.cacheKey ||
            this.getCacheKeyForURL(request.url);

        return cacheKey || request;
      },
    };
  }

  /**
   * Adds plugins to the precaching strategy.
   *
   * @param {Array<Object>} plugins
   */
  addPlugins(plugins: WorkboxPlugin[]) {
    this._plugins.push(...plugins);
  }

  /**
   * Creates a Workbox `Route` to handle requests for precached assets (based
   * on the passed configuration options).
   *
   * @param {Object} [options]
   * @param {string} [options.directoryIndex=index.html] The `directoryIndex`
   * will check cache entries for a URLs ending with '/' to see if there is a
   * hit when appending the `directoryIndex` value.
   * @param {Array<RegExp>} [options.ignoreURLParametersMatching=[/^utm_/, /^fbclid$/]] An
   * array of regex's to remove search params when looking for a cache match.
   * @param {boolean} [options.cleanURLs=true] The `cleanURLs` option will
   * check the cache for the URL with a `.html` added to the end of the end.
   * @param {module:workbox-precaching~urlManipulation} [options.urlManipulation]
   * This is a function that should take a URL and return an array of
   * alternative URLs that should be checked for precache matches.
   */
  addRoute(options?: FetchListenerOptions) {
    if (!this._router) {
      const matchCallback = this.createMatchCallback(options);
      const handlerCallback = this.createHandler(true);
      const route = new Route(matchCallback, handlerCallback);
      const router = new Router();

      router.registerRoute(route);
      router.addFetchListener();
      router.addCacheListener();

      this._router = router;
    }
  }

  /**
   * Adds items to the precache list, removing any duplicates and
   * stores the files in the
   * ["precache cache"]{@link module:workbox-core.cacheNames} when the service
   * worker installs.
   *
   * This method can be called multiple times.
   *
   * Please note: This method **will not** serve any of the cached files for you.
   * It only precaches files. To respond to a network request you call
   * [addRoute()]{@link module:workbox-precaching.PreacheController#addRoute}.
   *
   * If you have a single array of files to precache, you can just call
   * [precacheAndRoute()]{@link module:workbox-precaching.precacheAndRoute}.
   *
   * @param {Array<Object|string>} [entries=[]] Array of entries to precache.
   */
  precache(entries: Array<PrecacheEntry|string>) {
    this.addToCacheList(entries);

    if (!this._installed) {
      self.addEventListener('install', (event) => {
        event.waitUntil(this.install({event}));
      });
      self.addEventListener('activate', (event) => {
        event.waitUntil(this.activate());
      });
      this._installed = true;
    }
  }

  /**
   * This method will add entries to the precache list and add a route to
   * respond to fetch events.
   *
   * This is a convenience method that will call
   * [precache()]{@link module:workbox-precaching.PrecacheController#precache}
   * and
   * [addRoute()]{@link module:workbox-precaching.PrecacheController#addRoute}
   * in a single call.
   *
   * @param {Array<Object|string>} entries Array of entries to precache.
   * @param {Object} [options] See
   * [addRoute() options]{@link module:workbox-precaching.PrecacheController#addRoute}.
   */
  precacheAndRoute(entries: Array<PrecacheEntry|string>, options?: FetchListenerOptions) {
    this.precache(entries);
    this.addRoute(options);
  }

  /**
   * This method will add items to the precache list, removing duplicates
   * and ensuring the information is valid.
   *
   * @param {Array<module:workbox-precaching.PrecacheController.PrecacheEntry|string>} entries
   *     Array of entries to precache.
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

    const urlsToWarnAbout: string[] = [];
    for (const entry of entries) {
      // See https://github.com/GoogleChrome/workbox/issues/2259
      if (typeof entry === 'string') {
        urlsToWarnAbout.push(entry);
      } else if (entry && entry.revision === undefined) {
        urlsToWarnAbout.push(entry.url);
      }

      const {cacheKey, url} = createCacheKey(entry);
      const cacheMode = (typeof entry !== 'string' && entry.revision) ?
        'reload' : 'default';

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
      this._urlsToCacheModes.set(url, cacheMode);

      if (urlsToWarnAbout.length > 0) {
        const warningMessage = `Workbox is precaching URLs without revision ` +
          `info: ${urlsToWarnAbout.join(', ')}\nThis is generally NOT safe. ` +
          `Learn more at https://bit.ly/wb-precache`;
        if (process.env.NODE_ENV === 'production') {
          // Use console directly to display this warning without bloating
          // bundle sizes by pulling in all of the logger codebase in prod.
          console.warn(warningMessage);
        } else {
          logger.warn(warningMessage);
        }
      }
    }
  }

  /**
   * Precaches new and updated assets. Call this method from the service worker
   * install event.
   *
   * @param {Object} options
   * @param {Event} options.event The install event.
   * @param {Array<Object>} [options.plugins] Plugins to be used for fetching
   * and caching during install.
   * @return {Promise<module:workbox-precaching.InstallResult>}
   */
  async install({event, plugins}: {
    event: ExtendableEvent;
    plugins?: WorkboxPlugin[];
  }) {
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

    if (plugins) {
      this.addPlugins(plugins);
    }

    const toBePrecached: {cacheKey: string; url: string}[] = [];
    const alreadyPrecached: string[] = [];

    const cache = await self.caches.open(this._cacheName);
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

    // Cache entries one at a time.
    // See https://github.com/GoogleChrome/workbox/issues/2528
    for (const {cacheKey, url} of toBePrecached) {
      const integrity = this._cacheKeysToIntegrities.get(cacheKey);
      const cacheMode = this._urlsToCacheModes.get(url);
      await this._addURLToCache({
        cacheKey,
        cacheMode,
        event,
        integrity,
        url,
      });
    }

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
   * @return {Promise<module:workbox-precaching.CleanupResult>}
   */
  async activate() {
    const cache = await self.caches.open(this._cacheName);
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
   * @param {Event} options.event The install event.
   * @param {string} [options.cacheMode] The cache mode for the network request.
   * @param {string} [options.integrity] The value to use for the `integrity`
   * field when making the request.
   */
  async _addURLToCache({cacheKey, url, cacheMode, event, integrity}: {
    cacheKey: string;
    url: string;
    cacheMode: "reload" | "default" | "no-store" | "no-cache" | "force-cache" | "only-if-cached" | undefined;
    event: ExtendableEvent;
    integrity?: string;
  }) {
    const request = new Request(url, {
      integrity,
      cache: cacheMode,
      credentials: 'same-origin',
    });

    await Promise.all(this._getStrategy().handleAll({
      params: {cacheKey},
      request,
      event,
    }));
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
   * This acts as a drop-in replacement for
   * [`cache.match()`](https://developer.mozilla.org/en-US/docs/Web/API/Cache/match)
   * with the following differences:
   *
   * - It knows what the name of the precache is, and only checks in that cache.
   * - It allows you to pass in an "original" URL without versioning parameters,
   * and it will automatically look up the correct cache key for the currently
   * active revision of that URL.
   *
   * E.g., `matchPrecache('index.html')` will find the correct precached
   * response for the currently active service worker, even if the actual cache
   * key is `'/index.html?__WB_REVISION__=1234abcd'`.
   *
   * @param {string|Request} request The key (without revisioning parameters)
   * to look up in the precache.
   * @return {Promise<Response|undefined>}
   */
  async matchPrecache(request: string|Request): Promise<Response|undefined> {
    const url = request instanceof Request ? request.url : request;
    const cacheKey = this.getCacheKeyForURL(url);
    if (cacheKey) {
      const cache = await self.caches.open(this._cacheName);
      return cache.match(cacheKey);
    }
    return undefined;
  }

  /**
   * Creates a [`matchCallback`]{@link module:workbox-precaching~matchCallback}
   * based on the passed configuration options) that with will identify
   * requests in the precache and return a respective `params` object
   * containing the `cacheKey` of the precached asset.
   *
   * This `cacheKey` can be used by a
   * [`handlerCallback`]{@link module:workbox-precaching~handlerCallback}
   * to get the precached asset from the cache.
   *
   * @param {Object} [options] See
   * [addRoute() options]{@link module:workbox-precaching.PrecacheController#addRoute}.
   */
  createMatchCallback(options?: FetchListenerOptions) {
    return ({request}: RouteMatchCallbackOptions) => {
      const urlsToCacheKeys = this.getURLsToCacheKeys();
      for (const possibleURL of generateURLVariations(request.url, options)) {
        const cacheKey = urlsToCacheKeys.get(possibleURL);
        if (cacheKey) {
          return {cacheKey};
        }
      }
      if (process.env.NODE_ENV !== 'production') {
        logger.debug(`Precaching did not find a match for ` +
            getFriendlyURL(request.url));
      }
      return;
    }
  }

  /**
   * Returns a function that can be used within a
   * {@link module:workbox-routing.Route} that will find a response for the
   * incoming request against the precache.
   *
   * If for an unexpected reason there is a cache miss for the request,
   * this will fall back to retrieving the `Response` via `fetch()` when
   * `fallbackToNetwork` is `true`.
   *
   * @param {boolean} [fallbackToNetwork=true] Whether to attempt to get the
   * response from the network if there's a precache miss.
   * @return {module:workbox-routing~handlerCallback}
   */
  createHandler(fallbackToNetwork = true): RouteHandlerCallback {
    return (options: RouteHandlerCallbackOptions) => {
      const request = options.request instanceof Request ?
          options.request : new Request(options.request);

      options.params = options.params || {};

      options.params.fallbackToNetwork = fallbackToNetwork;
      if (!options.params.cacheKey) {
        options.params.cacheKey = this.getCacheKeyForURL(request.url);
      }

      return this._getStrategy().handle(options);
    };
  }

  /**
   * Returns a function that looks up `url` in the precache (taking into
   * account revision information), and returns the corresponding `Response`.
   *
   * If for an unexpected reason there is a cache miss when looking up `url`,
   * this will fall back to retrieving the `Response` via `fetch()` when
   * `fallbackToNetwork` is `true`.
   *
   * @param {string} url The precached URL which will be used to lookup the
   * `Response`.
   * @param {boolean} [fallbackToNetwork=true] Whether to attempt to get the
   * response from the network if there's a precache miss.
   * @return {module:workbox-routing~handlerCallback}
   */
  createHandlerBoundToURL(url: string, fallbackToNetwork = true): RouteHandlerCallback {
    const cacheKey = this.getCacheKeyForURL(url);
    if (!cacheKey) {
      throw new WorkboxError('non-precached-url', {url});
    }

    const handler = this.createHandler(fallbackToNetwork);
    const request = new Request(url);

    return (options) => handler(Object.assign(options, {request}));
  }

  _getStrategy(): Strategy {
    // NOTE: this needs to be done lazily to match v5 behavior, since the
    // `addPlugins()` method can be called at any time.
    if (!this._strategy) {
      this._strategy = new PrecacheStrategy({
        cacheName: this._cacheName,
        matchOptions: {
          ignoreSearch: true,
        },
        plugins: [
          this._cacheKeyPlugin,
          ...this._plugins,
        ],
      });
    }
    return this._strategy;
  }
}

export {PrecacheController};
