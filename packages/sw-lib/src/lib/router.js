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
} from '../../../sw-routing/src/index.js';
import ErrorFactory from './error-factory.js';

/**
 * Adds a friendly API on top of the router from the
 * {@link module:sw-routing|sw-routing module}.
 *
 * @example <caption>How to define a simple route with caching
 * strategy.</caption>
 *
 * goog.swlib.router.registerRoute('/about', goog.swlib.cacheFirst());
 *
 * @example <caption>How to define a simple route with custom caching
 * strategy.</caption>
 *
 * self.goog.swlib.router.registerRoute('/about', (args) => {
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
 * @memberof module:sw-lib
 */
class Router extends SWRoutingRouter {

  /**
   * @param {String|Regex|Route} capture The capture for a route can be one
   * of three types.
   * 1. It can be an Express style route, like: '/example/:anything/route/'
   *    The only gotcha with this is that it will only capture URL's on your
   *    origin.
   * 1. A regex that will be tested against request URL's.
   * 1. A [Route]{@link module:sw-lib.SWLib#Route} instance.
   * @param {function|Handler} handler Called when the route is caught by the
   * capture criteria. The handler argument is ignored if
   * you pass in a Route object, otherwise it's required.
   * If required, provide a function or a runtime caching strategy.
   */
  registerRoute(capture, handler) {
    if (typeof handler === 'function') {
      handler = {
        handle: handler,
      };
    }

    if (typeof capture === 'string') {
      if (capture.length === 0) {
        throw ErrorFactory.createError('empty-express-string');
      }

      super.registerRoute({
        route: new ExpressRoute({path: capture, handler}),
      });
    } else if (capture instanceof RegExp) {
      super.registerRoute({
        route: new RegExpRoute({regExp: capture, handler}),
      });
    } else if (capture instanceof Route) {
      super.registerRoute({route: capture});
    } else {
      throw ErrorFactory.createError('unsupported-route-type');
    }
  }

  /**
   * A shortcut used to register a {@link module:sw-routing.NavigationRoute}
   * instance that will respond to navigation requests using a cache entry for
   * `url`.
   *
   * This is useful when following the [App Shell pattern](https://developers.google.com/web/fundamentals/architecture/app-shell#example-html-for-appshell),
   * in which the previously cached shell is returned for all navigations.
   *
   * The `url` value should correspond to an entry that's already in the cache,
   * perhaps a URL that is managed by
   * {@link module:sw-lib.SWLib#cacheRevisionedAssets}. Using a URL that isn't
   * already cached will lead to failed navigations.
   *
   * @param {String} url The URL of the already cached HTML resource.
   * @param {Object} [options]
   * @param {Array<RegExp>} [options.blacklist] Defaults to an empty blacklist.
   * @param {Array<RegExp>} [options.whitelist] Defaults to `[/./]`, which will
   *        match all request URLs.
   */
  registerNavigationRoute(url, options = {}) {
    if (typeof url !== 'string') {
      throw ErrorFactory.createError('navigation-route-url-string');
    }

    super.registerRoute({route: new NavigationRoute({
      handler: () => caches.match(url),
      whitelist: options.whitelist || [/./],
      blacklist: options.blacklist || [],
    })});
  }
}

export default Router;
