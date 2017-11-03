/*
  Copyright 2017 Google Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import {assert, cacheNames} from 'workbox-core/_private.mjs';
import PrecacheController from './controllers/PrecacheController.mjs';
import './_version.mjs';

if (process.env.NODE_ENV !== 'production') {
  assert.isSwEnv('workbox-precaching');
}

let installActivateListenersAdded = false;
let fetchListenersAdded = false;
let suppressWarnings = false;

const cacheName = cacheNames.getPrecacheName();
const precacheController = new PrecacheController(cacheName);

const _removeIgnoreUrlParams = (origUrlObject, ignoreUrlParametersMatching) => {
  // Exclude initial '?'
  const searchString = origUrlObject.search.slice(1);

  // Split into an array of 'key=value' strings
  const keyValueStrings = searchString.split('&');
  const keyValuePairs = keyValueStrings.map((keyValueString) => {
    // Split each 'key=value' string into a [key, value] array
    return keyValueString.split('=');
  });
  const filteredKeyValuesPairs = keyValuePairs.filter((keyValuePair) => {
    return ignoreUrlParametersMatching
      .every((ignoredRegex) => {
        // Return true iff the key doesn't match any of the regexes.
        return !ignoredRegex.test(keyValuePair[0]);
      });
  });
  const filteredStrings = filteredKeyValuesPairs.map((keyValuePair) => {
    // Join each [key, value] array into a 'key=value' string
    return keyValuePair.join('=');
  });

  // Join the array of 'key=value' strings into a string with '&' in
  // between each
  const urlClone = new URL(origUrlObject);
  urlClone.search = filteredStrings.join('&');
  return urlClone;
};

/**
 * This function will take the request URL and manipulate it based on the
 * configuration options.
 *
 * @param {string} url
 * @param {Object} options
 * @return {string|null} Returns the URL in the cache that matches the request
 * if available, other null.
 *
 * @private
 */
const _getPrecachedUrl = (url, {
  ignoreUrlParametersMatching = [/^utm_/],
  directoryIndex = 'index.html',
} = {}) => {
  const urlObject = new URL(url, location);

  // If we precache '/some-url' but the URL referenced from the browser
  // is '/some-url#1234', the comparison won't work unless we normalise
  // the URLS.
  // See https://github.com/GoogleChrome/workbox/issues/488.
  urlObject.hash = '';

  const cachedUrls = precacheController.getCachedUrls();
  if (cachedUrls.indexOf(urlObject.href) !== -1) {
    // It's a perfect match
    return urlObject.href;
  }

  let strippedUrl = _removeIgnoreUrlParams(
    urlObject, ignoreUrlParametersMatching
  );
  if (cachedUrls.indexOf(strippedUrl.href) !== -1) {
    return strippedUrl.href;
  }

  if (directoryIndex && strippedUrl.pathname.endsWith('/')) {
    strippedUrl.pathname += directoryIndex;
    if (cachedUrls.indexOf(strippedUrl.href) !== -1) {
      return strippedUrl.href;
    }
  }

  return null;
};

const moduleExports = {};

/**
 * This method will add items to the precache list, removing duplicates
 * and ensuring the information is valid.
 *
 * @param {Array<Object|string>} entries Array of entries to precache.
 *
 * @alias module:workbox-precaching.precache
 */
moduleExports.precache = (entries) => {
  precacheController.addToCacheList(entries);

  if (installActivateListenersAdded || entries.length <= 0) {
    return;
  }

  installActivateListenersAdded = true;
  self.addEventListener('install', (event) => {
    event.waitUntil(precacheController.install({suppressWarnings}));
  });
  self.addEventListener('activate', (event) => {
    event.waitUntil(precacheController.cleanup());
  });
};

/**
 * This method will add a fetch listener to the service worker that will
 * respond to `FetchEvents` if they are known to be precached.
 *
 * If they aren't precached, the event will not be responded to, allowing
 * other `fetch` event listeners to respond to the `FetchEvent`.
 *
 * @param {Object} options
 * @param {string} [options.directoryIndex=index.html] The `directoryIndex` will
 * check cache entries for a URLs ending with '/' to see if there is a hit when
 * appending the `directoryIndex` value.
 * @param {Array<RegExp>} [options.ignoreUrlParametersMatching=[/^utm_/]] An
 * array of regex's to remove search params when looking for a cache match.
 *
 * @alias module:workbox-precaching.addRoute
 */
moduleExports.addRoute = (options) => {
  if (fetchListenersAdded) {
    // TODO Throw error here.
    return;
  }

  fetchListenersAdded = true;
  self.addEventListener('fetch', (event) => {
    const precachedUrl = _getPrecachedUrl(event.request.url, options);
    if (!precachedUrl) {
      return;
    }

    const responsePromise = caches.open(cacheName)
    .then((cache) => {
      return cache.match(precachedUrl);
    });
    event.respondWith(responsePromise);
  });
};

/**
 * This method will add entries for precaching and then add a route. This is
 * a convenience method that will call precache() and addRoute() in a single
 * call.
 *
 * @param {Array<Object|string>} entries Array of entries to precache.
 * @param {Object} options See
 * [addRoute() options]{@link module:workbox-precaching.addRoute}.
 *
 * @alias module:workbox-precaching.precacheAndRoute
 */
moduleExports.precacheAndRoute = (entries, options) => {
  moduleExports.precache(entries);
  moduleExports.addRoute(options);
};

/**
 * Warnings will be logged if any of the precached assets are entered without
 * a `revision` property. This is extremely dangerous if the URL's aren't
 * revisioned. However, the warnings can be supressed with this method.
 *
 * @param {boolean} suppress
 *
 * @alias module:workbox-precahcing.suppressWarnings
 */
moduleExports.suppressWarnings = (suppress) => {
  suppressWarnings = suppress;
};

export default moduleExports;
