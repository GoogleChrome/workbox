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

(function(global) {
  global.goog = global.goog || {};

  var log = global.goog.DEBUG ? console.debug.bind(console) : function() {};

  var idbDatabase;
  var IDB_VERSION = 1;
  var STOP_RETRYING_AFTER = 86400000; // One day, in milliseconds.
  var STORE_NAME = 'urls';
  var CACHE_NAME = 'offline-google-analytics';

  /**
   * This is basic boilerplate for interacting with IndexedDB. Adapted from
   * https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
   *
   * This is a private method that is exposed on the `goog` object to
   * facilitate testing.
   *
   * @private
   * @returns {undefined}
   */
  global.goog.openDatabaseAndReplayRequests = function() {
    var indexedDBOpenRequest = indexedDB.open('offline-analytics', IDB_VERSION);

    // This top-level error handler will be invoked any time there's an
    // IndexedDB-related error.
    indexedDBOpenRequest.onerror = function(error) {
      log('IndexedDB error:', error);
    };

    // This should only execute if there's a need to create a new database for
    // the given IDB_VERSION.
    indexedDBOpenRequest.onupgradeneeded = function() {
      this.result.createObjectStore(STORE_NAME, {keyPath: 'url'});
    };

    // This will execute each time the database is opened.
    indexedDBOpenRequest.onsuccess = function() {
      idbDatabase = this.result;
      replayAnalyticsRequests();
    };
  };

  /**
   * Helper method to get the object store that we care about.
   *
   * @private
   * @param {String} storeName
   * @param {String} mode
   * @returns {IDBObjectStore}
   */
  function getObjectStore(storeName, mode) {
    return idbDatabase.transaction(storeName, mode).objectStore(storeName);
  }

  /**
   * Replays all the queued requests found in IndexedDB, by calling fetch()
   * with an additional qt= parameter.
   *
   * @private
   * @returns {undefined}
   */
  function replayAnalyticsRequests() {
    var savedRequests = [];

    getObjectStore(STORE_NAME).openCursor().onsuccess = function(event) {
      // See https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#Using_a_cursor
      var cursor = event.target.result;

      if (cursor) {
        // Keep moving the cursor forward and collecting saved requests.
        savedRequests.push(cursor.value);
        cursor.continue();
      } else {
        // At this point, we have all the saved requests.
        savedRequests.forEach(function(savedRequest) {
          var queueTime = Date.now() - savedRequest.timestamp;
          if (queueTime > STOP_RETRYING_AFTER) {
            getObjectStore(STORE_NAME, 'readwrite').delete(savedRequest.url);
            log(' Request has been queued for %d milliseconds. ' +
              'No longer attempting to replay.', queueTime);
          } else {
            // The qt= URL parameter specifies the time delta in between right
            // now, and when the /collect request was initially attempted. See
            // https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#qt
            var requestUrl = savedRequest.url + '&qt=' + queueTime;

            fetch(requestUrl).then(function(response) {
              if (response.status < 400) {
                // If sending the /collect request was successful, then remove
                // it from the IndexedDB.
                getObjectStore(STORE_NAME, 'readwrite').delete(
                  savedRequest.url);
              } else {
                // This will be triggered if, e.g., Google Analytics returns a
                // HTTP 50x response. The request will be replayed the next time
                // the service worker starts up.
                log(' Replaying failed:', response);
              }
            }).catch(function(error) {
              // This will be triggered if the network is still down.
              // The request will be replayed again the next time the service
              // worker starts up.
              log(' Replaying failed:', error);
            });
          }
        });
      }
    };
  }

  /**
   * Adds a URL to IndexedDB, along with the current timestamp.
   *
   * This is a private method that is exposed on the `goog` object to
   * facilitate testing.
   *
   * @private
   * @param {Request} request
   * @returns {undefined}
   */
  global.goog.enqueueRequest = function(request) {
    var url = new URL(request.url);
    // TODO: This is done asynchronously without coordinating its completion
    // with the fetch handler that triggers it. It should ideally return
    // a promise that reflects the status of the IndexedDB transaction, and
    // the fetch handler should call event.waitUntil() on that promise.
    // In the current implementation, there's a very small chance the service
    // worker will be killed before the IndexedDB transaction completes.
    request.text().then(function(body) {
      // If there's a request body, then use it as the URL's search value.
      // This is most likely because the original request was an HTTP POST
      // that uses the beacon transport.
      if (body) {
        url.search = body;
      }

      getObjectStore(STORE_NAME, 'readwrite').add({
        url: url.toString(),
        timestamp: Date.now()
      });
    });
  };

  /**
   * `goog.useOfflineGoogleAnalytics` is the main entry point to the library
   * from within service worker code.
   *
   * ```js
   * // Inside your service worker JavaScript, ideally before any other
   * // 'fetch' event handlers are defined:
   *
   * // 1) Import the library into the service worker global scope, using
   * // https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
   * importScripts('path/to/offline-google-analytics-import.js');
   *
   * // 2) Call goog.useOfflineGoogleAnalytics() to activate the library.
   * goog.useOfflineGoogleAnalytics();
   *
   * // At this point, implement any other service worker caching strategies
   * // appropriate for your web app.
   * ```
   *
   * @alias goog.useOfflineGoogleAnalytics
   * @returns {undefined}
   */
  global.goog.useOfflineGoogleAnalytics = function() {
    // Open the IndexedDB and check for requests to replay each time the service
    // worker starts up.
    // Since the service worker is terminated fairly frequently, it should start
    // up again for most page navigations. It also might start up if it's used
    // in a background sync or a push notification context.
    global.goog.openDatabaseAndReplayRequests();

    global.addEventListener('fetch', function(event) {
      var url = new URL(event.request.url);
      var request = event.request;

      if ((url.hostname === 'www.google-analytics.com' ||
           url.hostname === 'ssl.google-analytics.com')) {
        if (url.pathname === '/collect') {
          // If this is a /collect request, then use a network-first strategy,
          // falling back to queueing the request in IndexedDB.

          // Make a clone of the request before we use it, in case we need
          // to read the request body later on.
          var clonedRequest = request.clone();

          event.respondWith(
            fetch(request).catch(function(error) {
              global.goog.enqueueRequest(clonedRequest);

              return error;
            })
          );
        } else if (url.pathname === '/analytics.js') {
          // If this is a request for the Google Analytics JavaScript library,
          // use the network first, falling back to the previously cached copy.
          event.respondWith(
            caches.open(CACHE_NAME).then(function(cache) {
              return fetch(request).then(function(response) {
                return cache.put(request, response.clone()).then(function() {
                  return response;
                });
              }).catch(function(error) {
                log(error);
                return cache.match(request);
              });
            })
          );
        }
      }
    });
  };
})(self);
