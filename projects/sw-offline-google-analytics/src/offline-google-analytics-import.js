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

/* eslint-env worker, serviceworker */

const constants = require('./lib/constants.js');
const enqueueRequest = require('./lib/enqueue-request.js');
const log = require('../../../lib/log.js');
const replayQueuedRequests = require('./lib/replay-queued-requests.js');
const scope = require('../../../lib/scope.js');

/**
 * In order to use the library, call`goog.useOfflineGoogleAnalytics()`.
 * It will take care of setting up service worker `fetch` handlers to ensure
 * that the Google Analytics JavaScript is available offline, and that any
 * Google Analytics requests made while offline are saved (using `IndexedDB`)
 * and retried the next time the service worker starts up.
 *
 * @example
 * // This code should live inside your service worker JavaScript, ideally
 * // before any other 'fetch' event handlers are defined:
 *
 * // First, import the library into the service worker global scope:
 * importScripts('path/to/offline-google-analytics-import.js');
 *
 * // Then, call goog.useOfflineGoogleAnalytics() to activate the library.:
 * goog.useOfflineGoogleAnalytics();
 *
 * // At this point, implement any other service worker caching strategies
 * // appropriate for your web app.
 *
 * @alias goog.useOfflineGoogleAnalytics
 * @returns {undefined}
 */
const useOfflineGoogleAnalytics = () => {
  self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    const request = event.request;

    if (url.hostname === constants.URL.HOST) {
      if (url.pathname === constants.URL.COLLECT_PATH) {
        // If this is a /collect request, then use a network-first strategy,
        // falling back to queueing the request in IndexedDB.

        // Make a clone of the request before we use it, in case we need
        // to read the request body later on.
        const clonedRequest = request.clone();

        event.respondWith(
          fetch(request).catch(error => {
            log('Enqueuing failed request...');
            return enqueueRequest(clonedRequest).then(() => error);
          })
        );
      } else if (url.pathname === constants.URL.ANALYTICS_JS_PATH) {
        // If this is a request for the Google Analytics JavaScript library,
        // use the network first, falling back to the previously cached copy.
        event.respondWith(
          caches.open(constants.CACHE_NAME).then(cache => {
            return fetch(request).then(response => {
              return cache.put(request, response.clone()).then(() => response);
            }).catch(error => {
              log(error);
              return cache.match(request);
            });
          })
        );
      }
    }
  });

  replayQueuedRequests();
};

// Add the function to the global service worker scope,
// as goog.useOfflineGoogleAnalytics.
scope('useOfflineGoogleAnalytics', useOfflineGoogleAnalytics);
