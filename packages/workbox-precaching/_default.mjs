/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert.mjs';
import {cacheNames} from 'workbox-core/_private/cacheNames.mjs';
import {getFriendlyURL} from 'workbox-core/_private/getFriendlyURL.mjs';
import {logger} from 'workbox-core/_private/logger.mjs';

import PrecacheController from './controllers/PrecacheController.mjs';
import {cleanupOutdatedCaches} from './utils/cleanupOutdatedCaches.mjs';
import {generateURLVariations} from './utils/generateURLVariations.mjs';

import './_version.mjs';

if (process.env.NODE_ENV !== 'production') {
  assert.isSWEnv('workbox-precaching');
}

let installActivateListenersAdded = false;
let fetchListenersAdded = false;
let suppressWarnings = false;
let plugins = [];

const cacheName = cacheNames.getPrecacheName();
const precacheController = new PrecacheController(cacheName);

/**
 * This function will take the request URL and manipulate it based on the
 * configuration options.
 *
 * @param {string} url
 * @param {Object} options
 * @return {string} Returns the URL in the cache that matches the request,
 * if possible.
 *
 * @private
 */
const _getCacheKeyForURL = (url, options) => {
  const urlsToCacheKeys = precacheController.getURLsToCacheKeys();
  for (const possibleURL of generateURLVariations(url, options)) {
    const possibleCacheKey = urlsToCacheKeys.get(possibleURL);
    if (possibleCacheKey) {
      return possibleCacheKey;
    }
  }
};

const moduleExports = {};

/**
 * Add items to the precache list, removing any duplicates and
 * store the files in the
 * ["precache cache"]{@link module:workbox-core.cacheNames} when the service
 * worker installs.
 *
 * This method can be called multiple times.
 *
 * Please note: This method **will not** serve any of the cached files for you.
 * It only precaches files. To respond to a network request you call
 * [addRoute()]{@link module:workbox-precaching.addRoute}.
 *
 * If you have a single array of files to precache, you can just call
 * [precacheAndRoute()]{@link module:workbox-precaching.precacheAndRoute}.
 *
 * @param {Array<Object|string>} entries Array of entries to precache.
 *
 * @alias workbox.precaching.precache
 */
moduleExports.precache = (entries) => {
  precacheController.addToCacheList(entries);

  if (installActivateListenersAdded || entries.length <= 0) {
    return;
  }

  installActivateListenersAdded = true;

  self.addEventListener('install', (event) => {
    event.waitUntil(
        precacheController.install({event, plugins, suppressWarnings})
            .catch((error) => {
              if (process.env.NODE_ENV !== 'production') {
                logger.error(`Service worker installation failed. It will ` +
                `be retried automatically during the next navigation.`);
              }
              // Re-throw the error to ensure installation fails.
              throw error;
            })
    );
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(precacheController.activate({event, plugins}));
  });
};

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
moduleExports.addRoute = ({
  ignoreURLParametersMatching = [/^utm_/],
  directoryIndex = 'index.html',
  cleanURLs = true,
  urlManipulation = null,
} = {}) => {
  if (fetchListenersAdded) {
    return;
  }

  fetchListenersAdded = true;

  self.addEventListener('fetch', (event) => {
    const precachedURL = _getCacheKeyForURL(event.request.url, {
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

    let responsePromise = caches.open(cacheName)
        .then((cache) => {
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
        logger.unprefixed.log(event.request);
        logger.groupEnd();

        logger.groupCollapsed(`View response details here.`);
        logger.unprefixed.log(response);
        logger.groupEnd();

        logger.groupEnd();
        return response;
      });
    }

    event.respondWith(responsePromise);
  });
};

/**
 * This method will add entries to the precache list and add a route to
 * respond to fetch events.
 *
 * This is a convenience method that will call
 * [precache()]{@link module:workbox-precaching.precache} and
 * [addRoute()]{@link module:workbox-precaching.addRoute} in a single call.
 *
 * @param {Array<Object|string>} entries Array of entries to precache.
 * @param {Object} options See
 * [addRoute() options]{@link module:workbox-precaching.addRoute}.
 *
 * @alias workbox.precaching.precacheAndRoute
 */
moduleExports.precacheAndRoute = (entries, options) => {
  moduleExports.precache(entries);
  moduleExports.addRoute(options);
};

/**
 * Adds plugins to precaching.
 *
 * @param {Array<Object>} newPlugins
 *
 * @alias workbox.precaching.addPlugins
 */
moduleExports.addPlugins = (newPlugins) => {
  plugins = plugins.concat(newPlugins);
};

/**
 * Adds an `activate` event listener which will clean up incompatible
 * precaches that were created by older versions of Workbox.
 *
 * @alias workbox.precaching.cleanupOutdatedCaches
 */
moduleExports.cleanupOutdatedCaches = () => {
  self.addEventListener('activate', (event) => {
    event.waitUntil(cleanupOutdatedCaches(cacheName).then((cachesDeleted) => {
      if (cachesDeleted.length > 0) {
        logger.log(`The following out-of-date precaches were cleaned up ` +
        `automatically:`, cachesDeleted);
      }
    }));
  });
};

/**
 * Takes in a URL, and returns the corresponding URL that could be used to
 * lookup the entry in the precache.
 *
 * If a relative URL is provided, the location of the service worker file will
 * be used as the base.
 *
 * For precached entries without revision information, the cache key will be the
 * same as the original URL.
 *
 * For precached entries with revision information, the cache key will be the
 * original URL with the addition of a query parameter used for keeping track of
 * the revision info.
 *
 * @param {string} url The URL whose cache key to look up.
 * @return {string} The cache key that corresponds to that URL.
 *
 * @alias workbox.precaching.getCacheKeyForURL
 */
moduleExports.getCacheKeyForURL = (url) => {
  return precacheController.getCacheKeyForURL(url);
};

export default moduleExports;
