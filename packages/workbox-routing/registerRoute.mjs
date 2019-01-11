/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from 'workbox-core/_private/logger.mjs';
import {WorkboxError} from 'workbox-core/_private/WorkboxError.mjs';
import {Route} from './Route.mjs';
import {RegExpRoute} from './RegExpRoute.mjs';
import {getOrCreateDefaultRouter} from './utils/getOrCreateDefaultRouter.mjs';
import './_version.mjs';


/**
 * Easily register a RegExp, string, or function with a caching
 * strategy to a singleton Router instance.
 *
 * This method will generate a Route for you if needed and
 * call [Router.registerRoute()]{@link
 * workbox.routing.Router#registerRoute}.
 *
 * @param {
 * RegExp|
 * string|
 * workbox.routing.Route~matchCallback|
 * workbox.routing.Route
 * } capture
 * If the capture param is a `Route`, all other arguments will be ignored.
 * @param {workbox.routing.Route~handlerCallback} handler A callback
 * function that returns a Promise resulting in a Response.
 * @param {string} [method='GET'] The HTTP method to match the Route
 * against.
 * @return {workbox.routing.Route} The generated `Route`(Useful for
 * unregistering).
 *
 * @alias workbox.routing.registerRoute
 */
export const registerRoute = (capture, handler, method = 'GET') => {
  let route;

  if (typeof capture === 'string') {
    const captureUrl = new URL(capture, location);

    if (process.env.NODE_ENV !== 'production') {
      if (!(capture.startsWith('/') || capture.startsWith('http'))) {
        throw new WorkboxError('invalid-string', {
          moduleName: 'workbox-routing',
          funcName: 'registerRoute',
          paramName: 'capture',
        });
      }

      // We want to check if Express-style wildcards are in the pathname only.
      // TODO: Remove this log message in v4.
      const valueToCheck = capture.startsWith('http') ?
          captureUrl.pathname : capture;

      // See https://github.com/pillarjs/path-to-regexp#parameters
      const wildcards = '[*:?+]';
      if (valueToCheck.match(new RegExp(`${wildcards}`))) {
        logger.debug(
            `The '$capture' parameter contains an Express-style wildcard ` +
          `character (${wildcards}). Strings are now always interpreted as ` +
          `exact matches; use a RegExp for partial or wildcard matches.`
        );
      }
    }

    const matchCallback = ({url}) => {
      if (process.env.NODE_ENV !== 'production') {
        if ((url.pathname === captureUrl.pathname) &&
            (url.origin !== captureUrl.origin)) {
          logger.debug(
              `${capture} only partially matches the cross-origin URL ` +
              `${url}. This route will only handle cross-origin requests ` +
              `if they match the entire URL.`);
        }
      }

      return url.href === captureUrl.href;
    };

    route = new Route(matchCallback, handler, method);
  } else if (capture instanceof RegExp) {
    route = new RegExpRoute(capture, handler, method);
  } else if (typeof capture === 'function') {
    route = new Route(capture, handler, method);
  } else if (capture instanceof Route) {
    route = capture;
  } else {
    throw new WorkboxError('unsupported-route-type', {
      moduleName: 'workbox-routing',
      funcName: 'registerRoute',
      paramName: 'capture',
    });
  }

  const defaultRouter = getOrCreateDefaultRouter();
  defaultRouter.registerRoute(route);

  return route;
};
