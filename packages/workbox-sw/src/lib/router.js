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

import {
  Router as SWRoutingRouter,
  ExpressRoute,
  RegExpRoute,
  Route,
  NavigationRoute,
} from '../../../workbox-routing/src/index.js';
import ErrorFactory from './error-factory.js';

/**
 * Adds a friendly API on top of the router from the
 * {@link module:workbox-routing|workbox-routing module}.
 *
 * @example <caption>How to define a simple route with caching
 * strategy.</caption>
 *
 * const workboxSW = new WorkboxSW();
 * workboxSW.router.registerRoute('/about',
 *  workboxSW.strategies.cacheFirst());
 *
 * @example <caption>How to define a simple route with custom caching
 * strategy.</caption>
 *
 * const workboxSW = new WorkboxSW();
 * workboxSW.router.registerRoute('/about', (args) => {
 *   // The requested URL
 *   console.log(args.url);
 *
 *   // The FetchEvent to handle
 *   console.log(args.event);
 *
 *   // The parameters from the matching route (Commonly
 *   // used with Regex / Express routes).
 *   console.log(args.params);
 *
 *   // Return a promise that resolves with a Response.
 *   return fetch(args.url);
 * }));
 *
 * @memberof module:workbox-sw
 */
class Router extends SWRoutingRouter {
  /**
   * Constructs a light wrapper on top of the underlying `Router`.
   * @param {String} revisionedCacheName The cache name used for entries cached
   *        via precache().
   * @param {boolean} handleFetch Determines if the router should handle fetch
   * events.
   */
  constructor(revisionedCacheName, handleFetch) {
    super({handleFetch});
    this._revisionedCacheName = revisionedCacheName;
  }

  /**
   * @param {String|RegExp|module:workbox-routing.matchCallback} capture
   * The capture for a route can be one of three types:
   * 1. An Express-style route, like `'/path/to/:anything'` for
   *    same-origin or `'https://cross-origin.com/path/to/:anything'` for
   *    cross-origin routes.
   * 1. A regular expression that will be tested against request URLs. For
   *    cross-origin routes, you must use a RegExp that matches the start of the
   *    full URL, like `new RegExp('https://cross-origin\.com/')`.
   * 1. A [function]{@link module:workbox-routing.matchCallback} which is
   *    passed the URL and `FetchEvent`, and should returns a truthy value if
   *    the route matches.
   * @param {function|module:workbox-runtime-caching.Handler} handler The
   * handler to use to provide a response if the route matches. The handler
   * argument is ignored if you pass in a Route object, otherwise it's required.
   * @param {String} [method] Only match requests that use this HTTP method.
   + Defaults to `'GET'`.
   * @return {module:workbox-routing.Route} The Route object that was
   * registered.
   */
  registerRoute(capture, handler, method = 'GET') {
    if (typeof handler === 'function') {
      handler = {
        handle: handler,
      };
    }

    let route;
    if (typeof capture === 'string') {
      if (capture.length === 0) {
        throw ErrorFactory.createError('empty-express-string');
      }
      route = new ExpressRoute({path: capture, handler, method});
    } else if (capture instanceof RegExp) {
      route = new RegExpRoute({regExp: capture, handler, method});
    } else if (typeof capture === 'function') {
      route = new Route({match: capture, handler, method});
    } else {
      throw ErrorFactory.createError('unsupported-route-type');
    }

    super.registerRoute({route});
    return route;
  }

  /**
   * A shortcut used to register a
   * [NavigationRoute]{@link module:workbox-routing.NavigationRoute} instance
   * that will respond to navigation requests using a cache entry for `url`.
   *
   * This is useful when following the [App Shell pattern](https://developers.google.com/web/fundamentals/architecture/app-shell#example-html-for-appshell),
   * in which the previously cached shell is returned for all navigations.
   *
   * The `url` value should correspond to an entry that's already in the cache,
   * perhaps a URL that is managed by
   * [precache()]{@link module:workbox-sw.WorkboxSW#precache}. Using a URL that
   * isn't already cached will lead to failed navigations.
   *
   * @param {String} url The URL of the already cached HTML resource.
   * @param {Object} [options]
   * @param {Array<RegExp>} [options.blacklist] Defaults to an empty blacklist.
   * @param {Array<RegExp>} [options.whitelist] Defaults to `[/./]`, which will
   *        match all request URLs.
   * @param {String} [options.cacheName] The name of the cache which contains
   *        the cached response for `url`. Defaults to the name of the cache
   *        used by precache().
   */
  registerNavigationRoute(url, options = {}) {
    if (typeof url !== 'string') {
      throw ErrorFactory.createError('navigation-route-url-string');
    }

    // Allow folks to explicitly pass in a null/undefined cacheName option if
    // they want that behavior.
    const cacheName = 'cacheName' in options ?
      options.cacheName :
      this._revisionedCacheName;

    super.registerRoute({route: new NavigationRoute({
      handler: () => caches.match(url, {cacheName}),
      whitelist: options.whitelist || [/./],
      blacklist: options.blacklist || [],
    })});
  }
}

export default Router;
