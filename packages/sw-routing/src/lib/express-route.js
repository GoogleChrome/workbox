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
   *        If the path contains [named parameters](https://github.com/pillarjs/path-to-regexp#named-parameters),
   *        then an Object mapping parameter names to the corresponding value
   *        will be passed to the handler via `params`.
   * @param {function} handler The handler to manage the response.
   * @param {string} [method] Only match requests that use this
   *        HTTP method. Defaults to `'GET'` if not specified.
   */
  constructor({path, handler, method}) {
    assert.isType({path}, 'string');
    assert.hasMethod({handler}, 'handle');

    let keys = [];
    // keys is populated as a side effect of pathToRegExp. This isn't the nicest
    // API, but so it goes.
    // https://github.com/pillarjs/path-to-regexp#usage
    const regExp = pathToRegExp(path, keys);
    const match = ({url}) => {
      const regexpMatches = url.pathname.match(regExp);

      // Return null immediately if this route doesn't match.
      if (!regexpMatches) {
        return null;
      }

      // If the route does match, then collect values for all the named
      // parameters that were returned in keys.
      // If there are no named parameters then this will end up returning {},
      // which is truthy, and therefore a sufficient return value.
      const namedParamsToValues = {};
      keys.forEach((key, index) => {
        namedParamsToValues[key.name] = regexpMatches[index + 1];
      });

      return namedParamsToValues;
    };

    super({match, handler, method});
  }
}

export default ExpressRoute;
