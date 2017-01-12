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
 * @memberof module:sw-routing
 */
class Route {
  /**
   * The constructor for Route expects an object with `match` and `handler`
   * properties which should both be functions.
   *
   * @param {function} match - The function that determines whether the
   *        route matches.
   * @param {Object} handler - An Object with a `handle` method. That method
   *        will be used to respond to matching requests.
   * @param {string} [method] Only match requests that use this
   *        HTTP method. Defaults to `'GET'` if not specified.
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
