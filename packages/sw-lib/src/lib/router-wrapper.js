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

import {Router, ExpressRoute, RegExpRoute, Route}
  from '../../../sw-routing/src/index.js';
import ErrorFactory from './error-factory.js';

/**
 * A simple class that pulls together a few different pieces from the
 * Router Module to surface them in a slightly easier API surface.
 */
class RouterWrapper {
  /**
   * Constructs a new RouterWrapper.
   */
  constructor() {
    this._router = new Router();
  }

  /**
   * @param {String|Regex|Route} capture the The capture for a route can be one
   * of three types.
   *     1. It can be an Express style route, like: '/example/:anything/route/'
   *        The only gotcha with this is that it will only capture URL's on your
   *        origin.
   *     2. A regex that will be tested against request URL's.
   *     3. A Route object
   * @param {function|Handler} handler The handler is ignored if you pass in
   * a Route, otherwise it's required. The handler will be called when the route
   * is caught by the capture criteria.
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

      this._router.registerRoute({
        route: new ExpressRoute({path: capture, handler}),
      });
    } else if (capture instanceof RegExp) {
      this._router.registerRoute({
        route: new RegExpRoute({regExp: capture, handler}),
      });
    } else if (capture instanceof Route) {
      this._router.registerRoute({route: capture});
    } else {
      throw ErrorFactory.createError('unsupported-route-type');
    }
  }
}

export default RouterWrapper;
