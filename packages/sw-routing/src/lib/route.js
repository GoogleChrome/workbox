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

import assert from '../../../../lib/assert';
import {defaultMethod, validMethods} from './constants';

/**
 * The Route class is used to configure a *when*
 * [predicate](https://en.wikipedia.org/wiki/Predicate_(mathematical_logic))
 * a handler.
 *
 * The *when* predicate is used by the Router to determine if a given request
 * matches this Route. If *when* returns true (i.e. this route matches the
 * current request), then the handler will be given the
 * [FetchEvent](https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent)
 * so that it can respond to the request.
 *
 * @memberof module:sw-routing
 */
class Route {
  /**
   * The constructor for Route expects an object with `when` and `handler`
   * properties which should both be functions.
   * @param {Object} options - Options to initialize the Route with.
   * @param {function} options.when - The when predicate function.
   * @param {function} options.handler - The handler function that will respond
   * to a FetchEvent.
   */
  constructor({match, handler, method} = {}) {
    assert.isType({match}, 'function');
    assert.hasMethod({handler}, 'handle');

    this.match = match;
    this.handler = handler;
    if (method) {
      assert.isOneOf({method}, validMethods);
      this.method = method;
    } else {
      this.method = defaultMethod;
    }
  }
}

export default Route;
