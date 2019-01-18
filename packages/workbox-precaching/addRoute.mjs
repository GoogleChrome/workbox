/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cacheNames} from 'workbox-core/_private/cacheNames.mjs';
import {getFriendlyURL} from 'workbox-core/_private/getFriendlyURL.mjs';
import {logger} from 'workbox-core/_private/logger.mjs';
import {getCacheKeyForURL} from './utils/getCacheKeyForURL.mjs';
import './_version.mjs';


let listenerAdded = false;

/**
 * Add a `fetch` listener to the service worker that will
 * respond to
 * [network requests]{@link https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#Custom_responses_to_requests}
 * with precached assets.
 *
 * Requests for assets that aren't precached, the `FetchEvent` will not be
 * responded to, allowing the event to fall through to other `fetch` event
 * listeners.
 *
 * @param {Object} options
 * @param {string} [options.directoryIndex=index.html] The `directoryIndex` will
 * check cache entries for a URLs ending with '/' to see if there is a hit when
 * appending the `directoryIndex` value.
 * @param {Array<RegExp>} [options.ignoreURLParametersMatching=[/^utm_/]] An
 * array of regex's to remove search params when looking for a cache match.
 * @param {boolean} [options.cleanURLs=true] The `cleanURLs` option will
 * check the cache for the URL with a `.html` added to the end of the end.
 * @param {workbox.precaching~urlManipulation} [options.urlManipulation]
 * This is a function that should take a URL and return an array of
 * alternative URL's that should be checked for precache matches.
 *
 * @alias workbox.precaching.addRoute
 */
export const addRoute = ({
  ignoreURLParametersMatching = [/^utm_/],
  directoryIndex = 'index.html',
  cleanURLs = true,
  urlManipulation = null,
} = {}) => {
  if (!listenerAdded) {
    const cacheName = cacheNames.getPrecacheName();

    addEventListener('fetch', (event) => {
      const precachedURL = getCacheKeyForURL(event.request.url, {
        cleanURLs,
        directoryIndex,
        ignoreURLParametersMatching,
        urlManipulation,
      });
      if (!precachedURL) {
        if (process.env.NODE_ENV !== 'production') {
          logger.debug(`Precaching did not find a match for ` +
            getFriendlyURL(event.request.url));
        }
        return;
      }

      let responsePromise = caches.open(cacheName).then((cache) => {
        return cache.match(precachedURL);
      }).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Fall back to the network if we don't have a cached response
        // (perhaps due to manual cache cleanup).
        if (process.env.NODE_ENV !== 'production') {
          logger.warn(`The precached response for ` +
          `${getFriendlyURL(precachedURL)} in ${cacheName} was not found. ` +
          `Falling back to the network instead.`);
        }

        return fetch(precachedURL);
      });

      if (process.env.NODE_ENV !== 'production') {
        responsePromise = responsePromise.then((response) => {
          // Workbox is going to handle the route.
          // print the routing details to the console.
          logger.groupCollapsed(`Precaching is responding to: ` +
            getFriendlyURL(event.request.url));
          logger.log(`Serving the precached url: ${precachedURL}`);

          logger.groupCollapsed(`View request details here.`);
          logger.log(event.request);
          logger.groupEnd();

          logger.groupCollapsed(`View response details here.`);
          logger.log(response);
          logger.groupEnd();

          logger.groupEnd();
          return response;
        });
      }

      event.respondWith(responsePromise);
    });

    listenerAdded = true;
  }
};
