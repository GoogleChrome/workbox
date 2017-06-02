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

import {isType, isOneOf} from '../../../../lib/assert';
import normalizeHandler from './normalize-handler';
import {defaultMethod, validMethods} from './constants';

/**
 * This is the definition of the `match` callback passed into the
 * `Route` constructor.
 *
 * This callback is used to determine if a new `fetch` event can be served
 * by this `Route`. Returning a truthy value indicates that this `Route` can
 * handle this `fetch` event. Return `null` if this shouldn't match against
 * the `fetch` event.
 *
 * If you do return a truthy value, the object will be passed to the
 * Route's `handler` (see the
 * [Route Constructor]{@link module:workbox-routing.Route}).
 *
 * @callback Route~matchCallback
 * @param {Object} input
 * @param {URL} input.url The request's URL.
 * @param {FetchEvent} input.event The event that triggered the `fetch` handler.
 * @return {Object|null} To signify a match, return a truthy value, otherwise
 * return null if the route shouldn't match. If you return an Object with
 * contents it will be passed to the `handler` in the `Route` constructor.
 * @memberof module:workbox-routing
 */

/**
 * This is the definition of the `handler` callback that can be passed into the
 * `Route` constructor.
 *
 * The `handler` callback is called when a request has been matched by
 * a `Route` and should return a Promise that resolves with a `Response`.
 *
 * @callback Route~handlerCallback
 * @param {Object} input
 * @param {URL} input.url The request's URL.
 * @param {FetchEvent} input.event The event that triggered the `fetch` handler.
 * @param {Object} [input.params] Parameters returned
 * the Route's [match callback]{@link
 *   module:workbox-routing.Route~matchCallback} function. This will be
 * undefined if nothing was returned.
 * @return {Promise<Response>} The response that will fulfill the request.
 * @memberof module:workbox-routing
 */

/**
 * A `Route` allows you to tell a service worker that it should handle
 * certain network requests using a specific response strategy.
 *
 * A consists or a matcher and a handler. A matcher needs to determine if a
 * route should be used for a request. A handler should handle the request
 * if it does match a Router.
 *
 * Instead of implementing your own handlers, you can use one of the
 * pre-defined runtime caching strategies from the
 * {@link module:workbox-runtime-caching|workbox-runtime-caching} module.
 *
 * There are also pre-defined Route's provided by this library:
 * {@link module:workbox-routing.RegExpRoute|RegExpRoute}
 * and {@link module:workbox-routing.ExpressRoute|ExpressRoute} subclasses
 * which provide a convenient wrapper with a nicer interface for using regular
 * expressions or Express-style routes as the `match` criteria.
 *
 * @example
 * // Any navigate requests for URLs that start with /path/to/ will match.
 * const route = new workbox.routing.Route({
 *   match: ({url, event}) => {
 *     return event.request.mode === 'navigate' &&
 *            url.pathname.startsWith('/path/to/');
 *   },
 *   handler: ({event}) => {
 *     // Do something that returns a Promise.<Response>, like:
 *     return caches.match(event.request);
 *   },
 * });
 *
 * const router = new workbox.routing.Router();
 * router.registerRoute({route});
 *
 * @memberof module:workbox-routing
 */
class Route {
  /**
   * Constructor for Route class.
   * @param {Object} input
   * @param {function} input.match The function that determines whether the
   * route matches a given `fetch` event.
   *
   * See [matchCallback]{@link module:workbox-routing.Route~matchCallback} for
   * full details on this function.
   * @param {function|module:workbox-runtime-caching.Handler} input.handler
   * This parameter can be either a function or an object which is a subclass
   * of `Handler`.
   *
   * Either option should result in a `Response` that the `Route` can use to
   * handle the `fetch` event.
   *
   * See [handlerCallback]{@link module:workbox-routing.Route~handlerCallback}
   * for full details on using a callback function as the `handler`.
   * @param {string} [input.method] Only match requests that use this
   * HTTP method.
   *
   * Defaults to `'GET'`.
   */
  constructor({match, handler, method} = {}) {
    this.handler = normalizeHandler(handler);

    isType({match}, 'function');
    this.match = match;

    if (method) {
      isOneOf({method}, validMethods);
      this.method = method;
    } else {
      this.method = defaultMethod;
    }
  }
}

export default Route;
