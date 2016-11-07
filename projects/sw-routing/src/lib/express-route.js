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
import pathToRegExp from 'path-to-regexp';

/**
 * ExpressRoute is a helper class to make defining Express-style
 * [Routes]{@link Route} easy.
 *
 * Under the hood, it uses the [`path-to-regexp`](https://www.npmjs.com/package/path-to-regexp)
 * library to transform the `path` parameter into a regular expression, which is
 * then matched against the URL's path.
 *
 * @memberof module:sw-routing
 * @extends Route
 */
class ExpressRoute extends Route {
  /**
   * @param {string} path The path to use for routing.
   * @param {function} handler The handler to manage the response.
   */
  constructor({path, handler, method}) {
    assert.isType({path}, 'string');
    assert.hasMethod({handler}, 'handle');

    const regExp = pathToRegExp(path);
    const match = ({url}) => url.pathname.match(regExp);
    super({match, handler, method});
  }
}

export default ExpressRoute;
