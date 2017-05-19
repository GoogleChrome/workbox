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

import ErrorFactory from './error-factory';
import Route from './route';
import pathToRegExp from 'path-to-regexp';

/**
 * `ExpressRoute` is a helper class to make defining Express-style
 * [Routes]{@link module:workbox-routing.Route} easy.
 *
 * Under the hood, it uses the [`path-to-regexp`](https://www.npmjs.com/package/path-to-regexp)
 * library to transform the `path` parameter into a regular expression, which is
 * then matched against the URL's path.
 *
 * Please note that `ExpressRoute` can match either same-origin or cross-origin
 * requests.
 *
 * To match same-origin requests, use a `path` value that begins with
 * `'/'`, e.g. `'/path/to/:file'`.
 *
 * To match cross-origin requests, use a `path` value that includes the origin,
 * e.g. `'https://example.com/path/to/:file'`.
 *
 * @example
 * // Any same-origin requests that start with /path/to and end with one
 * // additional path segment will match this route, with the last path
 * // segment passed along to the handler via params.file.
 * const route = new workbox.routing.ExpressRoute({
 *   path: '/path/to/:file',
 *   handler: ({event, params}) => {
 *     // params.file will be set based on the request URL that matched.
 *     return caches.match(params.file);
 *   },
 * });
 *
 * const router = new workbox.routing.Router();
 * router.registerRoute({route});
 *
 * @example
 * // Any cross-origin requests for https://example.com will match this route.
 * const route = new workbox.routing.ExpressRoute({
 *   path: 'https://example.com/path/to/:file',
 *   handler: ({event}) => return caches.match(event.request),
 * });
 *
 * const router = new workbox.routing.Router();
 * router.registerRoute({route});
 *
 * @memberof module:workbox-routing
 * @extends Route
 */
class ExpressRoute extends Route {
  /**
   * Constructor for ExpressRoute.
   *
   * @param {Object} input
   * @param {String} input.path The path to use for routing.
   * If the path contains [named parameters](https://github.com/pillarjs/path-to-regexp#named-parameters),
   * then an Object that maps parameter names to their corresponding value
   * will be passed to the handler via `params`.
   * @param {function|module:workbox-runtime-caching.Handler} input.handler The
   * handler to use to provide a response if the route matches.
   *
   * If you wish to use a callback function [see handlerCallback]{@link
   *   module:workbox-routing.Route~handlerCallback} for the callback
   * definition.
   * @param {string} [input.method] Only match requests that use this
   * HTTP method.
   *
   * Defaults to `'GET'`.
   */
  constructor({path, handler, method}) {
    if (!(path.startsWith('/') || path.startsWith('http'))) {
      throw ErrorFactory.createError('express-route-invalid-path');
    }

    let keys = [];
    // keys is populated as a side effect of pathToRegExp. This isn't the nicest
    // API, but so it goes.
    // https://github.com/pillarjs/path-to-regexp#usage
    const regExp = pathToRegExp(path, keys);
    const match = ({url}) => {
      // A path starting with '/' is a signal that we only want to match
      // same-origin. Bail out early if needed.
      if (path.startsWith('/') && url.origin !== location.origin) {
        return null;
      }

      // We need to match on either just the pathname or the full URL, depending
      // on whether the path parameter starts with '/' or 'http'.
      const pathNameOrHref = path.startsWith('/') ? url.pathname : url.href;
      const regexpMatches = pathNameOrHref.match(regExp);
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
