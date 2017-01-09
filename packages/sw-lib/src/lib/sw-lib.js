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

import RouterWrapper from './router-wrapper.js';
import ErrorFactory from './error-factory.js';
import {PrecacheManager} from '../../../sw-precaching/src/index.js';
import {
  CacheFirst, CacheOnly, NetworkFirst, NetworkOnly, StaleWhileRevalidate,
} from '../../../sw-runtime-caching/src/index.js';

/**
 * This is a high level library to help with using service worker
 * precaching and run time caching.
 *
 * @memberof module:sw-lib
 */
class SWLib {
  /**
   * Initialises an instance of SWLib. An instance of this class is
   * accessible when the module is imported into a service worker as
   * `self.goog.swlib`.
   */
  constructor() {
    this._router = new RouterWrapper();
    this._precacheManager = new PrecacheManager();
    this._strategies = {
      cacheFirst: new CacheFirst(),
      cacheOnly: new CacheOnly(),
      networkFirst: new NetworkFirst(),
      networkOnly: new NetworkOnly(),
      fastest: new StaleWhileRevalidate(),
    };
  }

  /**
   * Revisioned assets can be cached intelligently
   * during the install (i.e. old files are cleared from the cache, new files
   * are added to the cache and unchanged files are left as is).
   *
   * @example
   * self.goog.swlib.cacheRevisionedAssets([
   *     '/styles/main.1234.css',
   *     {
   *       url: '/index.html',
   *       revision: '1234'
   *     }
   * ]);
   *
   * @param {Array<String|Object>} revisionedFiles A set of urls to cache
   * when the service worker is installed.
   */
  cacheRevisionedAssets(revisionedFiles) {
    // Add a more helpful error message than assertion error.
    if (!Array.isArray(revisionedFiles)) {
      throw ErrorFactory.createError('bad-revisioned-cache-list');
    }

    this._precacheManager.cacheRevisioned({
      revisionedFiles,
    });
  }

  /**
   * Any assets you wish to cache ahead of time which can't be revisioned
   * should be cached with this method. All assets are cached on install
   * regardless of whether an older version of the request is in the cache.
   *
   * @example
   * self.goog.swlib.warmRuntimeCache([
   *     '/scripts/main.js',
   *     new Request('/images/logo.png')
   * ]);
   *
   * @param {Array<String|Request>} unrevisionedFiles A set of urls to cache
   * when the service worker is installed.
   */
  warmRuntimeCache(unrevisionedFiles) {
    // Add a more helpful error message than assertion error.
    if (!Array.isArray(unrevisionedFiles)) {
      throw ErrorFactory.createError('bad-revisioned-cache-list');
    }

    this._precacheManager.cacheUnrevisioned({
      unrevisionedFiles,
    });
  }

  /**
   * You can access the [Router]{@link module:sw-lib.RouterWrapper}
   * with `self.goog.swlib.router`.
   * @return {RouterWrapper} Returns the Router.
   */
  get router() {
    return this._router;
  }

  /**
   * This handler will check is there is a cache response and respond with it if
   * there is, otherwise it will make a network request and respond with that,
   * caching the response for the next time it's requested.
   *
   * @example
   * self.goog.swlib.router.registerRoute('/', self.google.swlib.cacheFirst);
   *
   * @return {Handler} A CacheFirst response handler.
   */
  get cacheFirst() {
    return this._strategies.cacheFirst;
  }

  /**
   * This handler will check is there is a cache response and respond with it if
   * there is, otherwise it will throw an error.
   *
   * @example
   * self.goog.swlib.router.registerRoute('/', self.google.swlib.cacheOnly);
   *
   * @return {Handler} A CacheOnly response handler.
   */
  get cacheOnly() {
    return this._strategies.cacheOnly;
  }

  /**
   * This handler will attempt to get a response from the network and respond
   * with it if available, updating the cache as well. If the network request
   * fails, it will respond with any cached response available.
   *
   * @example
   * self.goog.swlib.router.registerRoute('/', self.google.swlib.networkFirst);
   *
   * @return {Handler} A NetworkFirst response handler.
   */
  get networkFirst() {
    return this._strategies.networkFirst;
  }

  /**
   * This handle will only return with network requests.
   *
   * @example
   * self.goog.swlib.router.registerRoute('/', self.google.swlib.networkOnly);
   *
   * @return {Handler} A NetworkOnly response handler.
   */
  get networkOnly() {
    return this._strategies.networkOnly;
  }

  /**
   * This handler will check the cache and make a network request for all
   * requests. If the caches has a value it will be returned and when the
   * network request has finished, the cache will be updated. If there is no
   * cached response, the request will be forfilled by the network request.
   *
   * @example
   * self.goog.swlib.router.registerRoute('/', self.google.swlib.fastest);
   *
   * @return {Handler} A StaleWhileRevalidate response handler.
   */
  get fastest() {
    return this._strategies.fastest;
  }
}

export default SWLib;
