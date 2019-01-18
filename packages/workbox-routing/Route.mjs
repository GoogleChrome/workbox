/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert.mjs';

import {defaultMethod, validMethods} from './utils/constants.mjs';
import {normalizeHandler} from './utils/normalizeHandler.mjs';
import './_version.mjs';

/**
 * A `Route` consists of a pair of callback functions, "match" and "handler".
 * The "match" callback determine if a route should be used to "handle" a
 * request by returning a non-falsy value if it can. The "handler" callback
 * is called when there is a match and should return a Promise that resolves
 * to a `Response`.
 *
 * @memberof workbox.routing
 */
class Route {
  /**
   * Constructor for Route class.
   *
   * @param {workbox.routing.Route~matchCallback} match
   * A callback function that determines whether the route matches a given
   * `fetch` event by returning a non-falsy value.
   * @param {workbox.routing.Route~handlerCallback} handler A callback
   * function that returns a Promise resolving to a Response.
   * @param {string} [method='GET'] The HTTP method to match the Route
   * against.
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
