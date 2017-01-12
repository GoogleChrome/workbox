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

/**
 * RegExpRoute is a helper class to make defining Regular Expression based
 * [Routes]{@link Route} easy.
 *
 * @memberof module:sw-routing
 * @extends Route
 */
class RegExpRoute extends Route {
  /**
   * @param {RegExp} regExp The regular expression to match against URLs.
   *        If the `RegExp` contains [capture groups](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp#grouping-back-references),
   *        then the array of captured values will be passed to the handler via
   *        `params`.
   * @param {function} handler The handler to manage the response.
   * @param {string} [method] Only match requests that use this
   *        HTTP method. Defaults to `'GET'` if not specified.
   */
  constructor({regExp, handler, method}) {
    assert.isInstance({regExp}, RegExp);

    const match = ({url}) => {
      const regexpMatches = url.href.match(regExp);
      // Return null immediately if this route doesn't match.
      if (!regexpMatches) {
        return null;
      }

      // If the route matches, but there aren't any capture groups defined, then
      // this will return [], which is truthy and therefore sufficient to
      // indicate a match.
      // If there are capture groups, then it will return their values.
      return regexpMatches.slice(1);
    };

    super({match, handler, method});
  }
}

export default RegExpRoute;
