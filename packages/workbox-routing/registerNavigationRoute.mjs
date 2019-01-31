/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert.mjs';
import {cacheNames} from 'workbox-core/_private/cacheNames.mjs';
import {logger} from 'workbox-core/_private/logger.mjs';
import {NavigationRoute} from './NavigationRoute.mjs';
import {getOrCreateDefaultRouter} from './utils/getOrCreateDefaultRouter.mjs';
import './_version.mjs';


/**
 * Registers a route that will return a precached file for a navigation
 * request. This is useful for the
 * [application shell pattern]{@link https://developers.google.com/web/fundamentals/architecture/app-shell}.
 *
 * When determining the URL of the precached HTML document, you will likely need
 * to call `workbox.precaching.getCacheKeyForURL(originalUrl)`, to account for
 * the fact that Workbox's precaching naming conventions often results in URL
 * cache keys that contain extra revisioning info.
 *
 * This method will generate a
 * [NavigationRoute]{@link workbox.routing.NavigationRoute}
 * and call
 * [Router.registerRoute()]{@link workbox.routing.Router#registerRoute} on a
 * singleton Router instance.
 *
 * @param {string} cachedAssetUrl The cache key to use for the HTML file.
 * @param {Object} [options]
 * @param {string} [options.cacheName] Cache name to store and retrieve
 * requests. Defaults to precache cache name provided by
 * [workbox-core.cacheNames]{@link workbox.core.cacheNames}.
 * @param {Array<RegExp>} [options.blacklist=[]] If any of these patterns
 * match, the route will not handle the request (even if a whitelist entry
 * matches).
 * @param {Array<RegExp>} [options.whitelist=[/./]] If any of these patterns
 * match the URL's pathname and search parameter, the route will handle the
 * request (assuming the blacklist doesn't match).
 * @return {workbox.routing.NavigationRoute} Returns the generated
 * Route.
 *
 * @alias workbox.routing.registerNavigationRoute
 */
export const registerNavigationRoute = (cachedAssetUrl, options = {}) => {
  if (process.env.NODE_ENV !== 'production') {
    assert.isType(cachedAssetUrl, 'string', {
      moduleName: 'workbox-routing',
      funcName: 'registerNavigationRoute',
      paramName: 'cachedAssetUrl',
    });
  }

  const cacheName = cacheNames.getPrecacheName(options.cacheName);
  const handler = async () => {
    try {
      const response = await caches.match(cachedAssetUrl, {cacheName});

      if (response) {
        return response;
      }

      // This shouldn't normally happen, but there are edge cases:
      // https://github.com/GoogleChrome/workbox/issues/1441
      throw new Error(`The cache ${cacheName} did not have an entry for ` +
          `${cachedAssetUrl}.`);
    } catch (error) {
      // If there's either a cache miss, or the caches.match() call threw
      // an exception, then attempt to fulfill the navigation request with
      // a response from the network rather than leaving the user with a
      // failed navigation.
      if (process.env.NODE_ENV !== 'production') {
        logger.debug(`Unable to respond to navigation request with ` +
            `cached response. Falling back to network.`, error);
      }

      // This might still fail if the browser is offline...
      return fetch(cachedAssetUrl);
    }
  };

  const route = new NavigationRoute(handler, {
    whitelist: options.whitelist,
    blacklist: options.blacklist,
  });

  const defaultRouter = getOrCreateDefaultRouter();
  defaultRouter.registerRoute(route);

  return route;
};
