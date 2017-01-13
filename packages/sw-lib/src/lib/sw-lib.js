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
import {Behavior as CacheExpirationBehavior} from
  '../../../sw-cache-expiration/src/index.js';
import {Behavior as BroadcastCacheUpdateBehavior} from
  '../../../sw-broadcast-cache-update/src/index.js';
import {
  CacheFirst, CacheOnly, NetworkFirst,
  NetworkOnly, StaleWhileRevalidate, RequestWrapper,
}
  from '../../../sw-runtime-caching/src/index.js';

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
   * A getter for the Router Wrapper.
   * @return {RouterWrapper} Returns the Router Wrapper
   */
  get router() {
    return this._router;
  }

  /**
   * A cache first run-time caching strategy.
   * @param {Object} options Options object that can be used to define
   * arguments on the caching strategy.
   * @return {CacheFirst} The caching handler instance.
   */
  cacheFirst(options) {
    return this._getCachingMechanism(CacheFirst, options);
  }

  /**
   * A cache only run-time caching strategy.
   * @param {Object} options Options object that can be used to define
   * arguments on the caching strategy.
   * @return {CacheFirst} The caching handler instance.
   */
  cacheOnly(options) {
    return this._getCachingMechanism(CacheOnly, options);
  }

  /**
   * A network first run-time caching strategy.
   * @param {Object} options Options object that can be used to define
   * arguments on the caching strategy.
   * @return {CacheFirst} The caching handler instance.
   */
  networkFirst(options) {
    return this._getCachingMechanism(NetworkFirst, options);
  }

  /**
   * A network only run-time caching strategy.
   * @param {Object} options Options object that can be used to define
   * arguments on the caching strategy.
   * @return {CacheFirst} The caching handler instance.
   */
  networkOnly(options) {
    return this._getCachingMechanism(NetworkOnly, options);
  }

  /**
   * A stale while revalidate run-time caching strategy.
   * @param {Object} options Options object that can be used to define
   * arguments on the caching strategy.
   * @return {CacheFirst} The caching handler instance.
   */
  staleWhileRevalidate(options) {
    return this._getCachingMechanism(StaleWhileRevalidate, options);
  }

  /**
   * @private
   * @param {Class} HandlerClass The class to be configured and instantiated.
   * @param {Object} options Options to configure the handler.
   * @return {Handler} A handler instance configured with the appropriate
   * behaviours
   */
  _getCachingMechanism(HandlerClass, options = {}) {
    const behaviorParamsToClass = {
      'cacheExpiration': CacheExpirationBehavior,
      'broadcastCacheUpdate': BroadcastCacheUpdateBehavior,
    };

    const wrapperOptions = {
      behaviors: [],
    };

    if (options['cacheName']) {
      wrapperOptions['cacheName'] = options['cacheName'];
    }

    // Iterate over known behaviors and add them to Request Wrapper options.
    const behaviorKeys = Object.keys(behaviorParamsToClass);
    behaviorKeys.forEach((behaviorKey) => {
      if (options[behaviorKey]) {
        const BehaviorClass = behaviorParamsToClass[behaviorKey];
        const behaviorParams = options[behaviorKey];

        wrapperOptions.behaviors.push(new BehaviorClass(behaviorParams));
      }
    });

    // Add custom behaviors.
    if (options.behaviors) {
      options.behaviors.forEach((behavior) => {
        wrapperOptions.behaviors.push(behavior);
      });
    }

    return new HandlerClass({
      requestWrapper: new RequestWrapper(wrapperOptions),
    });
  }
}

export default SWLib;
