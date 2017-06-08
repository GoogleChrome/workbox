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
import {isInstance} from '../../../../lib/assert';
import logHelper from '../../../../lib/log-helper.js';

/**
 * RegExpRoute is a helper class to make defining regular expression based
 * [Routes]{@link module:workbox-routing.Route} easy.
 *
 * The matching for regular expressioned are slightly different between
 * same-origin requests and cross-origin requests.
 *
 * A common pattern is to use a regex pattern similar to `/styles/.*` to capture
 * all stylesheets on your site.
 *
 * If we used this on `https://workboxjs.org`,
 * this regular expression would match for the end of
 * <code>https://workboxjs.org<strong>/styles/main.css</strong></code>.
 *
 * However, it's unlikely that we'd intend for this to match against:
 * <code>https://third-party-origin.com<strong>/styles/example.css</strong></code>.
 *
 * To overcome this common issue, regular expressions will only match against
 * cross-origin requests if the regular expression matches from the start.
 *
 * For example, matching the cross-origin example, we could change the
 * regular expression to: `https://third-party-origin.com/styles/.*`, meaning
 * we would now match <code><strong>https://third-party-origin.com/styles/example.css</strong></code>.
 *
 * If you wish your regular expression to match both, you just need to ensure
 * you account for the full URL.
 *
 * @memberof module:workbox-routing
 * @extends Route
 *
 * @example
 * // Any requests that match the regular expression will match this route, with
 * // the capture groups passed along to the handler as an array via params.
 * const route = new workbox.routing.RegExpRoute({
 *   regExp: new RegExp('^https://example.com/path/to/(\\w+)'),
 *   handler: {
 *     handle: ({event, params}) => {
 *       // params[0], etc. will be set based on the regexp capture groups.
 *       // Do something that returns a Promise.<Response>, like:
 *       return caches.match(event.request);
 *     },
 *   },
 * });
 *
 * const router = new workbox.routing.Router();
 * router.registerRoute({route});
 */
class RegExpRoute extends Route {
  /**
   * Constructor for RegExpRoute.
   *
   * @param {Object} input
   * @param {RegExp} input.regExp The regular expression to match against URLs.
   * If the `RegExp` contains [capture groups](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp#grouping-back-references),
   * then the array of captured values will be passed to the `handler` as
   * `params`.
   * @param {function|module:workbox-runtime-caching.Handler} input.handler The
   * handler to use to provide a response if the route matches.
   *
   * If you wish to use a callback function [see handlerCallback]{@link
   *   module:workbox-routing.Route~handlerCallback} for the callback
   * definition.
   * @param {string} [input.method] Only match requests that use this
   * HTTP method. Defaults to `'GET'` if not specified.
   */
  constructor({regExp, handler, method}) {
    isInstance({regExp}, RegExp);

    const match = ({url}) => {
      const result = regExp.exec(url.href);

      // Return null immediately if this route doesn't match.
      if (!result) {
        return null;
      }

      // If this is a cross-origin request, then confirm that the match included
      // the start of the URL. This means that regular expressions like
      // /styles.+/ will only match same-origin requests.
      // See https://github.com/GoogleChrome/workbox/issues/281#issuecomment-285130355
      if ((url.origin !== location.origin) && (result.index !== 0)) {
        logHelper.debug({
          that: this,
          message: `Skipping route, because the RegExp match didn't occur ` +
            `at the start of the URL.`,
          data: {url: url.href, regExp},
        });

        return null;
      }

      // If the route matches, but there aren't any capture groups defined, then
      // this will return [], which is truthy and therefore sufficient to
      // indicate a match.
      // If there are capture groups, then it will return their values.
      return result.slice(1);
    };

    super({match, handler, method});
  }
}

export default RegExpRoute;
