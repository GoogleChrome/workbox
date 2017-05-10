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

import Route from './route';
import assert from '../../../../lib/assert';
import logHelper from '../../../../lib/log-helper.js';
import normalizeHandler from './normalize-handler';

/**
 * The Router takes one or more [Routes]{@link Route} and registers a [`fetch`
 * event listener](https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent)
 * that will respond to network requests if there's a matching route.
 *
 * It also allows you to define a "default" handler that applies to any requests
 * that don't explicitly match a `Route`, and a "catch" handler that responds
 * to any requests that throw an exception while being routed.
 *
 * @memberof module:workbox-routing
 *
 * @example
 * // The following example sets up two routes, one to match requests with
 * // "assets" in their URL, and the other for requests with "images", along
 * // different runtime caching handlers for each.
 * // Both the routes are registered with the router, and any requests that
 * // don't match either route will be handled using the default NetworkFirst
 * // strategy.
 * const assetRoute = new RegExpRoute({
 *   regExp: /assets/,
 *   handler: new goog.runtimeCaching.StaleWhileRevalidate(),
 * });
 * const imageRoute = new RegExpRoute({
 *   regExp: /images/,
 *   handler: new goog.runtimeCaching.CacheFirst(),
 * });
 *
 * const router = new goog.routing.Router();
 * router.registerRoutes({routes: [assetRoute, imageRoute]});
 * router.setDefaultHandler({handler: new goog.runtimeCaching.NetworkFirst()});
 */
class Router {
  /**
   * Start with an empty array of routes, and set up the fetch handler.
   */
  constructor({handleFetch} = {}) {
    if (typeof handleFetch === 'undefined') {
      handleFetch = true;
    }

    // _routes will contain a mapping of HTTP method name ('GET', etc.) to an
    // array of all the corresponding Route instances that are registered.
    this._routes = new Map();

    if (handleFetch) {
      this._addFetchListener();
    }
  }

  /**
   * This method will actually add the fetch event listener.
   */
  _addFetchListener() {
    self.addEventListener('fetch', (event) => {
      const url = new URL(event.request.url);
      if (!url.protocol.startsWith('http')) {
        logHelper.log({
          that: this,
          message: 'URL does not start with HTTP and so not passing ' +
            'through the router.',
          data: {
            request: event.request,
          },
        });
        return;
      }

      let responsePromise;
      let matchingRoute;
      for (let route of (this._routes.get(event.request.method) || [])) {
        const matchResult = route.match({url, event});
        if (matchResult) {
          matchingRoute = route;

          logHelper.log({
            that: this,
            message: 'The router found a matching route.',
            data: {
              route: matchingRoute,
              request: event.request,
            },
          });

          let params = matchResult;

          if (Array.isArray(params) && params.length === 0) {
            // Instead of passing an empty array in as params, use undefined.
            params = undefined;
          } else if (params.constructor === Object &&
                     Object.keys(params).length === 0) {
            // Instead of passing an empty object in as params, use undefined.
            params = undefined;
          }

          responsePromise = route.handler.handle({url, event, params});
          break;
        }
      }

      if (!responsePromise && this.defaultHandler) {
        responsePromise = this.defaultHandler.handle({url, event});
      }

      if (responsePromise && this.catchHandler) {
        responsePromise = responsePromise.catch((error) => {
          return this.catchHandler.handle({url, event, error});
        });
      }

      if (responsePromise) {
        event.respondWith(responsePromise
          .then((response) => {
            logHelper.debug({
              that: this,
              message: 'The router is managing a route with a response.',
              data: {
                route: matchingRoute,
                request: event.request,
                response: response,
              },
            });

            return response;
          }));
      }
    });
  }

  /**
   * An optional {RouteHandler} that's called by default when no routes
   * explicitly match the incoming request.
   *
   * If the default is not provided, unmatched requests will go against the
   * network as if there were no service worker present.
   *
   * @example
   * router.setDefaultHandler({
   *   handler: new goog.runtimeCaching.NetworkFirst()
   * });
   *
   * @param {Object} input
   * @param {module:workbox-routing.RouteHandler} input.handler The handler to
   * use to provide a response.
   */
  setDefaultHandler({handler} = {}) {
    this.defaultHandler = normalizeHandler(handler);
  }

  /**
   * If a Route throws an error while handling a request, this {RouteHandler}
   * will be called and given a chance to provide a response.
   *
   * @example
   * router.setCatchHandler(({event}) => {
   *   if (event.request.mode === 'navigate') {
   *     return caches.match('/error-page.html');
   *   }
   *   return Response.error();
   * });
   *
   * @param {Object} input
   * @param {module:workbox-routing.RouteHandler} input.handler The handler to
   * use to provide a response.
   */
  setCatchHandler({handler} = {}) {
    this.catchHandler = normalizeHandler(handler);
  }

  /**
   * Register routes will take an array of Routes to register with the
   * router.
   *
   * @example
   * router.registerRoutes({
   *   routes: [
   *     new RegExpRoute({ ... }),
   *     new ExpressRoute({ ... }),
   *     new Route({ ... }),
   *   ]
   * });
   *
   * @param {Object} input
   * @param {Array<Route>} input.routes An array of routes to
   * register.
   */
  registerRoutes({routes} = {}) {
    assert.isArrayOfClass({routes}, Route);

    for (let route of routes) {
      if (!this._routes.has(route.method)) {
        this._routes.set(route.method, []);
      }

      // Give precedence to the most recent route by listing it first.
      this._routes.get(route.method).unshift(route);
    }
  }

  /**
   * Registers a single route with the router.
   *
   * @example
   * router.registerRoute({
   *   route: new Route({ ... })
   * });
   *
   * @param {Object} input
   * @param {module:workbox-routing.Route} input.route The route to register.
   */
  registerRoute({route} = {}) {
    assert.isInstance({route}, Route);

    this.registerRoutes({routes: [route]});
  }
}

export default Router;
