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

import {assert, logger} from 'workbox-core/_private.mjs';

import {Route} from './Route.mjs';
import './_version.mjs';

/**
 * RegExpRoute is a helper class to make defining regular expression based
 * [Routes]{@link module:workbox-routing.Route} easy.
 *
 * Please note that this only needs to match any part of the URL for same-origin
 * requests. For requests against third-party servers, you must define a RegExp
 * that matches the start of the URL.
 *
 * For example,
 *
 * ```
 * // Matches all local styles
 * new RegExpRoute(new RegExp('/styles/'), ...);
 * ```
 *
 * while
 *
 * ```js
*  // Matches third-party styles
 * new RegexpRoute(new RegExp('https://example\.com/styles/'), ...);
 * ```
 *
 * @memberof module:workbox-routing
 * @extends Route
 */
class RegExpRoute extends Route {
  /**
   * If the `RegExp` associated with this route contains
   * [capture groups](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp#grouping-back-references),
   * then the array of captured values will be passed to `handler` as `params`.
   *
   * @param {RegExp} regExp The regular expression to match against URLs.
   * @param {module:workbox-routing.Route~handlerCallback} handler The callback
   * function that will provide the response for matching requests.
   * @param {string} [method='GET'] Restrict the route to only match requests
   * that use this HTTP method.
   */
  constructor(regExp, handler, method) {
    if (process.env.NODE_ENV !== 'production') {
      assert.isInstance(regExp, RegExp, {
        moduleName: 'workbox-routing',
        className: 'RegExpRoute',
        funcName: 'constructor',
        paramName: 'pattern',
      });
    }

    const match = ({url}) => {
      const result = regExp.exec(url.href);

      // Return null immediately if there's no match.
      if (!result) {
        return null;
      }

      // Require that the match start at the first character in the URL string
      // if it's a cross-origin request.
      // See https://github.com/GoogleChrome/workbox/issues/281 for the context
      // behind this behavior.
      if ((url.origin !== location.origin) && (result.index !== 0)) {
        if (process.env.NODE_ENV !== 'production') {
          logger.debug(
            `The regular expression '${regExp}' only partially matched ` +
            `against the cross-origin URL '${url}'. RegExpRoute's will only ` +
            `handle cross-origin requests if they match the entrie URL.`
          );
        }

        return null;
      }

      // If the route matches, but there aren't any capture groups defined, then
      // this will return [], which is truthy and therefore sufficient to
      // indicate a match.
      // If there are capture groups, then it will return their values.
      return result.slice(1);
    };

    super(match, handler, method);
  }
}

export {RegExpRoute};
