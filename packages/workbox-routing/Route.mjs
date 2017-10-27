/*
 Copyright 2017 Google Inc. All Rights Reserved.
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

import {assert} from 'workbox-core/_private.mjs';

import {defaultMethod, validMethods} from './utils/constants.mjs';
import normalizeHandler from './utils/normalizeHandler.mjs';
import './_version.mjs';

/**
 * The `match` callback is used to determine if a new service worker `fetch`
 * event should be handled this `Route`. Returning a truthy value means
 * this `Route` will handle and respond to this `fetch` event.
 *
 * Return `null` if this Route shouldn't match against the `fetch` event.
 *
 * Any truthy value returned by this callback will be passed to the
 * Route's `handler` callback.
 *
 * This callback is passed into the
 * [Route Constructor]{@link module:workbox-routing.Route}.
 *
 * @callback Route~matchCallback
 * @param {Object} context
 * @param {URL} context.url The request's URL.
 * @param {FetchEvent} context.event The event that triggered the `fetch`
 * handler.
 * @return {Object|null} To signify a match, return anything other than `null`.
 * Return `null` if the route shouldn't match. If you return an Object with
 * contents, it will be passed to the Route's
 * [handler]{@link module:workbox-routing.Route~handlerCallback}.
 *
 * @memberof module:workbox-routing
 */

/**
 * The `handler` callback is called when a new service worker `fetch` event
 * has been matched by a `Route`. This callback should return a Promise that
 * resolves with a `Response`.
 *
 * If a value is returned by the `match` callback it will be passed in
 * as the `params` argument of this callback.
 *
 * This callback is passed into the
 * [Route Constructor]{@link module:workbox-routing.Route}.
 *
 * @callback Route~handlerCallback
 * @param {Object} context
 * @param {URL} context.url The request's URL.
 * @param {FetchEvent} context.event The event that triggered the `fetch`
 * handler.
 * @param {Object} [context.params] Parameters returned by the Route's
 * [match callback]{@link module:workbox-routing.Route~matchCallback} function.
 * This will be undefined if nothing was returned.
 * @return {Promise<Response>} The response that will fulfill the request.
 *
 * @memberof module:workbox-routing
 */

/**
 * A `Route` consists or a matcher and a handler. A matcher needs to determine
 * if a route should be used for a request. A handler returns a response
 * to the request if there's a match.
 *
 * @memberof module:workbox-routing
 */
class Route {
  /**
   * Constructor for Route class.
   *
   * @param {module:workbox-routing.Route~matchCallback} match
   * A callback function that determines whether the route matches a given
   * `fetch` event.
   * @param {
   *   module:workbox-routing.Route~handlerCallback |
   *   module:workbox-runtime-caching.Handler
   * } handler This parameter can be either a callback function or an object
   * which implements the `Handler` interface.
   * @param {string} [method='GET'] Restrict the route to only match requests
   * that use this HTTP method.
   */
  constructor(match, handler, method) {
    if (process.env.NODE_ENV !== 'production') {
      assert.isType(match, 'function', {
        moduleName: 'workbox-routing',
        className: 'Route',
        funcName: 'constructor',
        paramName: 'match',
      });

      if (method) {
        assert.isOneOf(method, validMethods, {paramName: 'method'});
      }
    }

    // These values are referenced directly by Router so cannot be
    // altered by minifification.
    this.handler = normalizeHandler(handler);
    this.match = match;
    this.method = method || defaultMethod;
  }
}

export {Route};
