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

import core from 'workbox-core';

import {defaultMethod, validMethods} from './constants.mjs';
import normalizeHandler from './normalizeHandler.mjs';

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
 * @param {Object} context
 * @param {URL} context.url The request's URL.
 * @param {FetchEvent} context.event The event that triggered the `fetch`
 * handler.
 * @return {Object|null} To signify a match, return anything other than `null`.
 * Return `null` if the route shouldn't match. If you return an Object with
 * contents, it will be passed to the Route's
 * [handler]{@link module:workbox-routing.Route~handlerCallback}.
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
 * @param {Object} context
 * @param {URL} context.url The request's URL.
 * @param {FetchEvent} context.event The event that triggered the `fetch`
 * handler.
 * @param {Object} [context.params] Parameters returned by the Route's
 * [match callback]{@link module:workbox-routing.Route~matchCallback} function.
 * This will be undefined if nothing was returned.
 * @return {Promise<Response>} The response that will fulfill the request.
 * @memberof module:workbox-routing
 */

/**
 * A `Route` consists or a matcher and a handler. A matcher needs to determine
 * if a route should be used for a request. A handler returns a response
 * to the request if there's a match.
 *
 * @memberof module:workbox-routing
 */
export default class Route {
  /**
   * Constructor for Route class.
   * @param {Route~matchCallback} match The function that determines whether the
   * route matches a given `fetch` event.
   *
   * See [matchCallback]{@link module:workbox-routing.Route~matchCallback} for
   * full details on this function.
   * @param {Route~handlerCallback|module:workbox-runtime-caching.Handler}
   * handler This parameter can be either a function or an object which is a
   * subclass of `Handler`.
   *
   * Either option should result in a `Response` that the `Route` can use to
   * handle the `fetch` event.
   *
   * See [handlerCallback]{@link module:workbox-routing.Route~handlerCallback}
   * for full details on using a callback function as the `handler`.
   * @param {string} [method='GET'] Only match requests that use this HTTP
   * method.
   */
  constructor(match, handler, method) {
    if (process.env.NODE_ENV !== 'production') {
      core.assert.isType(match, 'function', {
        moduleName: 'workbox-routing',
        className: 'Route',
        funcName: 'constructor',
        paramName: 'match',
      });

      if (method) {
        core.assert.isOneOf(method, validMethods, {paramName: 'method'});
      }
    }

    this._handler = normalizeHandler(handler);
    this._match = match;
    this._method = method || defaultMethod;
  }
}
