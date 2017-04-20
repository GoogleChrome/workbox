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

/* eslint-env browser, serviceworker */

import Router from './router.js';
import Strategies from './strategies';
import ErrorFactory from './error-factory.js';
import {RevisionedCacheManager} from '../../../sw-precaching/src/index.js';
import {Route} from '../../../sw-routing/src/index.js';
import logHelper from '../../../../lib/log-helper';
import {getDefaultCacheName} from '../../../sw-runtime-caching/src/index.js';

/**
 * A high level library to make it as easy as possible to precache assets
 * efficiently and define run time caching strategies.
 *
 * @memberof module:sw-lib
 */
class SWLib {

  /**
   * You should instantiate this class with `new self.goog.SWLib()`.
   * @param {Object} input
   * @param {string} cacheId Defining a cacheId is useful to ensure uniqueness
   * across cache names. Useful if you have multiple sites served over
   * localhost.
   * @param {boolean} clientsClaim To claim currently open clients set
   * this value to true. (Default false).
   * @param  {String} [input.directoryIndex]  The directoryIndex will
   * check cache entries for a URLs ending with '/' to see if there is a hit
   * when appending the directoryIndex (i.e. '/index.html').
   */
  constructor({cacheId, clientsClaim, handleFetch,
    directoryIndex = 'index.html'} = {}) {
    if (cacheId && (typeof cacheId !== 'string' || cacheId.length === 0)) {
      throw ErrorFactory.createError('bad-cache-id');
    }
    if (clientsClaim && (typeof clientsClaim !== 'boolean')) {
      throw ErrorFactory.createError('bad-clients-claim');
    }
    if (typeof directoryIndex !== 'undefined') {
      if (directoryIndex === false || directoryIndex === null) {
        directoryIndex = false;
      } else if (typeof directoryIndex !== 'string' ||
        directoryIndex.length === 0) {
        throw ErrorFactory.createError('bad-directory-index');
      }
    }

    this._runtimeCacheName = getDefaultCacheName({cacheId});
    this._revisionedCacheManager = new RevisionedCacheManager({
      cacheId,
    });
    this._strategies = new Strategies({
      cacheId,
    });

    this._router = new Router(
      this._revisionedCacheManager.getCacheName(),
      handleFetch
    );
    this._registerInstallActivateEvents(clientsClaim);
    this._registerDefaultRoutes(directoryIndex);
  }

  /**
   * Revisioned assets can be cached intelligently
   * during the install (i.e. old files are cleared from the cache, new files
   * are added to the cache and unchanged files are left as is).
   *
   * The input needs to be an array of URL strings which having revisioning
   * details in them otherwise the entry should be an object with `url` and
   * `revision` parameters.
   *
   * In addition to maintaining the cache, this method will also set up the
   * necessary routes to serve the precached assets using a cache-first
   * strategy.
   *
   * @example <caption>Cache revisioned assets.</caption>
   * // Cache a set of revisioned URLs
   * const swlib = new goog.SWLib();
   * swlib.precache([
   *     '/styles/main.613e6c7332dd83e848a8b00c403827ed.css',
   *     '/images/logo.59a325f32baad11bd47a8c515ec44ae5.jpg'
   * ]);
   *
   * // ...precache() can also take objects to cache
   * // non-revisioned URLs.
   * // Please use sw-build or sw-cli to generate the manifest for you.
   * swlib.precache([
   *     {
   *       url: '/index.html',
   *       revision: '613e6c7332dd83e848a8b00c403827ed'
   *     },
   *     {
   *       url: '/about.html',
   *       revision: '59a325f32baad11bd47a8c515ec44ae5'
   *     }
   * ]);
   *
   * @param {Array<String|Object>} revisionedFiles A set of urls to cache
   * when the service worker is installed.
   */
  precache(revisionedFiles) {
    // Add a more helpful error message than assertion error.
    if (!Array.isArray(revisionedFiles)) {
      throw ErrorFactory.createError('bad-revisioned-cache-list');
    }

    this._revisionedCacheManager.addToCacheList({
      revisionedFiles,
    });
  }

  /**
   * The router for this library is exposed via the `router` parameter.
   * This is an instance of the {@link  module:sw-lib.Router|Router}.
   *
   * @example
   * const swlib = new goog.SWLib();
   * swlib.router.registerRoute('/', swlib.goog.cacheFirst());
   *
   * @type {Router}
   */
  get router() {
    return this._router;
  }

  /**
   * RuntimeStrategyOptions is just a JavaScript object, but the structure
   * explains the options for runtime strategies used in sw-lib.
   *
   * See the example of how this can be used with the `cacheFirst()` caching
   * strategy.
   *
   * @example
   * const swlib = new goog.SWLib();
   * const cacheFirstStrategy = swlib.strategies.cacheFirst({
   *   cacheName: 'example-cache',
   *   cacheExpiration: {
   *     maxEntries: 10,
   *     maxAgeSeconds: 7 * 24 * 60 * 60
   *   },
   *   broadcastCacheUpdate: {
   *     channelName: 'example-channel-name'
   *   },
   *   cacheableResponse: {
   *     statuses: [0, 200, 404],
   *     headers: {
   *       'Example-Header-1': 'Header-Value-1'
   *       'Example-Header-2': 'Header-Value-2'
   *     }
   *   }
   *   plugins: [
   *     // Additional Plugins
   *   ]
   * });
   *
   * @typedef {Object} RuntimeStrategyOptions
   * @property {String} cacheName Name of cache to use
   * for caching (both lookup and updating).
   * @property {Object} cacheExpiration Defining this
   * object will add a cache expiration plugins to this strategy.
   * @property {Number} cacheExpiration.maxEntries
   * The maximum number of entries to store in a cache.
   * @property {Number} cacheExpiration.maxAgeSeconds
   * The maximum lifetime of a request to stay in the cache before it's removed.
   * @property {Object} broadcastCacheUpdate Defining
   * this object will add a broadcast cache update plugin.
   * @property {String} broadcastCacheUpdate.channelName
   * The name of the broadcast channel to dispatch messages on.
   * @property {Array<plugins>} plugins For
   * any additional plugins you wish to add, simply include them in this
   * array.
   * @memberof module:sw-lib.SWLib
   */

  /**
   * The supported caching strategies shipped with sw-lib are provided via the
   * `strategies` object.
   * {@link module:sw-lib.Strategies|See Strategies for a complete list}.
   * @type {module.sw-lib.Strategies} Object containing the available
   * caching strategies in sw-lib.
   *
   * @example
   * const swlib = new goog.SWLib();
   * swlib.router.registerRoute('/styles/*',
   *  swlib.strategies.cacheFirst());
   */
  get strategies() {
    return this._strategies;
  }

  /**
   * The name of the cache used by default by the runtime caching strategies.
   *
   * Entries that are managed via `precache()` are stored in a separate cache
   * with a different name.
   *
   * You can override the default cache name when constructing a strategy if
   * you'd prefer, via
   * `swlib.strategies.cacheFirst({cacheName: 'my-cache-name'});`
   *
   * If you would like to explicitly add to, remove, or check the contents of
   * the default cache, you can use the [Cache Storage API](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage)
   * to pass in the default cache name to `caches.open()`. This can be useful if
   * you want to "prime" your cache with remote resources that can't be properly
   * managed via `precache()`.
   *
   * @example
   * const cache = await caches.open(swlib.runtimeCacheName);
   * await cache.add('https://third-party.com/path/to/file');
   * const contentsOfRuntimeCache = await cache.keys();
   */
  get runtimeCacheName() {
    return this._runtimeCacheName;
  }

  /**
   * This method will register listeners for the install and activate events.
   * @private
   * @param {boolean} clientsClaim Whether to claim clients in activate or not.
   */
  _registerInstallActivateEvents(clientsClaim) {
    self.addEventListener('install', (event) => {
      const cachedUrls = this._revisionedCacheManager.getCachedUrls();
      if (cachedUrls.length > 0) {
        logHelper.debug({
          that: this,
          message: `The precached URLs will automatically be served using a
            cache-first strategy.`,
          data: {'Precached URLs': JSON.stringify(cachedUrls)},
        });
      }

      event.waitUntil(this._revisionedCacheManager.install());
    });

    self.addEventListener('activate', (event) => {
      event.waitUntil(
        this._revisionedCacheManager.cleanup()
        .then(() => {
          if (clientsClaim) {
            return self.clients.claim();
          }
        })
      );
    });
  }

  /**
   * This method will register any default routes the library will need.
   * @private
   * @param {string} directoryIndex The directory index is appended to URLs
   * ending with '/'.
   */
  _registerDefaultRoutes(directoryIndex) {
    const plugins = [];
    // Add custom directory index plugin.
    if (directoryIndex) {
      plugins.push(this._getDirectoryIndexPlugin(directoryIndex));
    }

    const cacheFirstHandler = this.strategies.cacheFirst({
      cacheName: this._revisionedCacheManager.getCacheName(),
      plugins,
    });

    const route = new Route({
      match: ({url}) => {
        const cachedUrls = this._revisionedCacheManager.getCachedUrls();
        if (cachedUrls.indexOf(url.href) !== -1) {
          return true;
        }

        if (directoryIndex && url.pathname.endsWith('/')) {
          url.pathname += directoryIndex;
          return cachedUrls.indexOf(url.href) !== -1;
        }

        return false;
      },
      handler: cacheFirstHandler,
    });
    this.router.registerRoute(route);
  }

  /**
   * @param {string} directoryIndex The directory index is appended to URLs
   * ending with '/'.
   * @return {Promise<Object>} Returns a plugin that attempts to match the
   * URL with /index.html
   */
  _getDirectoryIndexPlugin(directoryIndex) {
    const directoryIndexFunc = async (
      {request, cache, cachedResponse, matchOptions}) => {
      // If we already have a cache hit, then just return that.
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise, try again with the indexHtmlString value.
      if (request.url.endsWith('/')) {
        let url = new URL(request.url);
        url.pathname += directoryIndex;
        return cache.match(url.toString(), matchOptions);
      }
    };

    return {cacheWillMatch: directoryIndexFunc};
  }
}

export default SWLib;
