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
import {isArrayOfClass, isInstance} from '../../../../lib/assert';
import logHelper from '../../../../lib/log-helper.js';
import normalizeHandler from './normalize-handler';

/**
 * The Router takes one or more [Routes]{@link Route} and allows you to apply
 * that routing logic to determine the appropriate way of handling requests
 * inside of a service worker.
 *
 * It also allows you to define a "default" handler that applies to any requests
 * that don't explicitly match a `Route`, and a "catch" handler that responds
 * to any requests that throw an exception while being routed.
 *
 * You can use the `handleRequest()` method to pass a `FetchEvent` through the
 * router and ultimately get a "routed response" back.
 * If you'd like this to be handled automatically for you, calling
 * `addFetchListener()` will cause the `Router` to respond to `fetch` events.
 *
 * If a request matches multiple routes, precedence will be given to the 
 * last-registered route.
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
 * // "If a request matches both routes, the last route will be used to handle 
 * // the request, in this case, the "images" handler would take precedence.
 * const assetRoute = new RegExpRoute({
 *   regExp: /assets/,
 *   handler: new workbox.runtimeCaching.StaleWhileRevalidate(),
 * });
 * const imageRoute = new RegExpRoute({
 *   regExp: /images/,
 *   handler: new workbox.runtimeCaching.CacheFirst(),
 * });
 *
 * const router = new workbox.routing.Router();
 * router.addFetchListener();
 * router.registerRoutes({routes: [assetRoute, imageRoute]});
 * router.setDefaultHandler({
 *   handler: new workbox.runtimeCaching.NetworkFirst(),
 * });
 */
class Router {
  /**
   * Constructs a new `Router` instance, without any registered routes.
   */
  constructor() {
    // _routes will contain a mapping of HTTP method name ('GET', etc.) to an
    // array of all the corresponding Route instances that are registered.
    this._routes = new Map();
    this._isListenerRegistered = false;
  }

  /**
   * This will register a `fetch` event listener on your behalf which will check
   * the incoming request to see if there's a matching route, and only respond
   * if there is a match.
   *
   * @example
   * const imageRoute = new RegExpRoute({
   *   regExp: /images/,
   *   handler: new CacheFirst(),
   * });
   *
   * const router = new Router();
   * router.registerRoute({route: imageRoute});
   * router.addFetchListener();
   *
   * @return {boolean} Returns `true` if this is the first time the method is
   * called and the listener was registered. Returns `false` if called again,
   * as the listener will only be registered once.
   */
  addFetchListener() {
    if (!this._isListenerRegistered) {
      this._isListenerRegistered = true;
      self.addEventListener('fetch', (event) => {
        const responsePromise = this.handleRequest({event});
        if (responsePromise) {
          event.respondWith(responsePromise);
        }
      });
      return true;
    } else {
      logHelper.warn({
        that: this,
        message: `addFetchListener() has already been called for this Router.`,
      });
      return false;
    }
  }

  /**
   * This can be used to apply the routing rules to generate a response for a
   * given request inside your own `fetch` event handler.
   *
   * @example
   * const imageRoute = new RegExpRoute({
   *   regExp: /images/,
   *   handler: new CacheFirst(),
   * });
   *
   * const router = new Router();
   * router.registerRoute({route: imageRoute});
   *
   * self.addEventListener('fetch', (event) => {
   *   event.waitUntil((async () => {
   *     let response = await router.handleRequest({event});
   *     // Do something with response, and then eventually respond with it.
   *     event.respondWith(response);
   *   })());
   * });
   *
   * @param {Object} input
   * @param {FetchEvent} input.event The event passed in to a `fetch` handler.
   * @return {Promise<Response>|undefined} Returns a promise for a response,
   * taking the registered routes into account. If there was no matching route
   * and there's no `defaultHandler`, then returns undefined.
   */
  handleRequest({event}) {
    isInstance({event}, FetchEvent);
    const url = new URL(event.request.url);
    if (!url.protocol.startsWith('http')) {
      logHelper.log({
        that: this,
        message: `The URL does not start with HTTP, so it can't be handled.`,
        data: {
          request: event.request,
        },
      });
      return;
    }

    let {handler, params} = this._findHandlerAndParams({event, url});

    // If we don't have a handler because there was no matching route, then
    // fall back to defaultHandler if that's defined.
    if (!handler && this.defaultHandler) {
      handler = this.defaultHandler;
    }

    if (handler) {
      let responsePromise = handler.handle({url, event, params});
      if (this.catchHandler) {
        responsePromise = responsePromise.catch((error) => {
          return this.catchHandler.handle({url, event, error});
        });
      }
      return responsePromise;
    }
  }

  /**
   * Checks the incoming event.request against the registered routes, and if
   * there's a match, returns the corresponding handler along with any params
   * generated by the match.
   *
   * @param {FetchEvent} input.event
   * @param {URL} input.url
   * @return {Object} Returns an object with `handler` and `params` properties.
   * They are populated if a matching route was found or `undefined` otherwise.
   * @private
   */
  _findHandlerAndParams({event, url}) {
    const routes = this._routes.get(event.request.method) || [];
    for (const route of routes) {
      let matchResult = route.match({url, event});
      if (matchResult) {
        logHelper.log({
          that: this,
          message: 'The router found a matching route.',
          data: {
            route,
            request: event.request,
          },
        });

        if (Array.isArray(matchResult) && matchResult.length === 0) {
          // Instead of passing an empty array in as params, use undefined.
          matchResult = undefined;
        } else if (matchResult.constructor === Object &&
          Object.keys(matchResult).length === 0) {
          // Instead of passing an empty object in as params, use undefined.
          matchResult = undefined;
        }

        // Break out of the loop and return the appropriate values as soon as
        // we have a match.
        return {
          params: matchResult,
          handler: route.handler,
        };
      }
    }

    // If we didn't have a match, then return undefined values.
    return {handler: undefined, params: undefined};
  }

  /**
   * An optional `handler` that's called by default when no routes
   * explicitly match the incoming request.
   *
   * If the default is not provided, unmatched requests will go against the
   * network as if there were no service worker present.
   *
   * @example
   * router.setDefaultHandler({
   *   handler: new workbox.runtimeCaching.NetworkFirst()
   * });
   *
   * @param {Object} input
   * @param {function|module:workbox-runtime-caching.Handler} input.handler
   * This parameter can be either a function or an object which is a subclass
   * of `Handler`.
   *
   * Either option should result in a `Response` that the `Route` can use to
   * handle the `fetch` event.
   *
   * See [handlerCallback]{@link module:workbox-routing.Route~handlerCallback}
   * for full details on using a callback function as the `handler`.
   */
  setDefaultHandler({handler} = {}) {
    this.defaultHandler = normalizeHandler(handler);
  }

  /**
   * If a Route throws an error while handling a request, this `handler`
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
   * @param {function|module:workbox-runtime-caching.Handler} input.handler
   * This parameter can be either a function or an object which is a subclass
   * of `Handler`.
   *
   * Either option should result in a `Response` that the `Route` can use to
   * handle the `fetch` event.
   *
   * See [handlerCallback]{@link module:workbox-routing.Route~handlerCallback}
   * for full details on using a callback function as the `handler`.
   */
  setCatchHandler({handler} = {}) {
    this.catchHandler = normalizeHandler(handler);
  }

  /**
   * Registers an array of routes with the router.
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
   * @param {Array<module:workbox-routing.Route>} input.routes An array of
   * routes to register.
   */
  registerRoutes({routes} = {}) {
    isArrayOfClass({routes}, Route);

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
    isInstance({route}, Route);

    this.registerRoutes({routes: [route]});
  }

  /**
   * Unregisters an array of routes with the router.
   *
   * @example
   * const firstRoute = new RegExpRoute({ ... });
   * const secondRoute = new RegExpRoute({ ... });
   * router.registerRoutes({routes: [firstRoute, secondRoute]});
   *
   * // Later, if you no longer want the routes to be used:
   * router.unregisterRoutes({routes: [firstRoute, secondRoute]});
   *
   * @param {Object} input
   * @param {Array<module:workbox-routing.Route>} input.routes An array of
   * routes to unregister.
   */
  unregisterRoutes({routes} = {}) {
    isArrayOfClass({routes}, Route);

    for (let route of routes) {
      if (!this._routes.has(route.method)) {
        logHelper.error({
          that: this,
          message: `Can't unregister route; there are no ${route.method}
            routes registered.`,
          data: {route},
        });
      }

      const routeIndex = this._routes.get(route.method).indexOf(route);
      if (routeIndex > -1) {
        this._routes.get(route.method).splice(routeIndex, 1);
      } else {
        logHelper.error({
          that: this,
          message: `Can't unregister route; the route wasn't previously
            registered.`,
          data: {route},
        });
      }
    }
  }

  /**
   * Unregisters a single route with the router.
   *
   * @example
   * const route = new RegExpRoute({ ... });
   * router.registerRoute({route});
   *
   * // Later, if you no longer want the route to be used:
   * router.unregisterRoute({route});
   *
   * @param {Object} input
   * @param {module:workbox-routing.Route} input.route The route to unregister.
   */
  unregisterRoute({route} = {}) {
    isInstance({route}, Route);

    this.unregisterRoutes({routes: [route]});
  }
}

export default Router;
