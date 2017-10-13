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
import {_private} from 'workbox-core';

import '../_version.mjs';
import Route from './Route.mjs';

/**
 * RegExpRoute is a helper class to make defining regular expression based
 * [Routes]{@link module:workbox-routing.Route} easy.
 *
 * The matching for regular expressions is slightly different depending on
 * whether the request URL is
 * [same-origin](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy),
 * or cross-origin. Here's why:
 *
 * It's common to use a broad pattern like `new RegExp('/styles/')` to match
 * all URLs served from a `/styles/` directory on your site.
 *
 * If we used this in a service worker deployed on `https://example.com`,
 * this `RegExp` would trigger a match for
 * <code>https://example.com<strong>/styles/main.css</strong></code>, as
 * intended.
 *
 * However, it's unlikely that we'd intend for this to trigger matches for
 * <code>https://third-party-origin.com<strong>/styles/example.css</strong></code>.
 *
 * To overcome this common issue, `RegExpRoute` will only trigger a match for a
 * cross-origin request if the `RegExp` provided matches at the *start* of the
 * cross-origin URL. For same-origin requests, the match can be
 * *anywhere* within the URL. In both cases, the `RegExp` only needs to match
 * some portion of the URL, not the full URL.
 *
 * If you *do* want a `RegExpRoute` to trigger matches for some cross-origin
 * requests, then going back to our styles example, you could use
 * `new RegExp('https://third-party-origin\.com/styles/')`, which will trigger
 * a match for URLs like
 * <code><strong>https://third-party-origin.com/styles/example.css</strong></code>.
 *
 * If you want to use a single `RegExpRoute` that triggers a match for both
 * same- and cross-origin requests, then use a `RegExp` that includes a wildcard
 * that will match the start of any URL, like new `RegExp('.+/styles/')`.
 *
 * @memberof module:workbox-routing
 * @extends Route
 */
class RegExpRoute extends Route {
  /**
   * Constructor for `RegExpRoute`.
   *
   * @param {RegExp} regExp The regular expression to match against URLs.
   * If the `RegExp` contains [capture groups](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp#grouping-back-references),
   * then the array of captured values will be passed to `handler` as `params`.
   * @param {
   *   module:workbox-routing.Route~handlerCallback |
   *   module:workbox-runtime-caching.Handler
   * } handler This parameter can be either a callback function or an object
   * which implements the `Handler` interface.
   * @param {string} [method='GET'] Restrict the route to only match requests
   * that use this HTTP method.
   */
  constructor(regExp, handler, method) {
    if (process.env.NODE_ENV !== 'production') {
      core.assert.isInstance(regExp, RegExp, {
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
          _private.logger.debug(`Skipping route, because while ${regExp} matched
            ${url}, the request is cross-origin and the match did not occur at
            the start of the URL.`);
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

export default RegExpRoute;
