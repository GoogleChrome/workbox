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

(function(global) {
  global.goog = global.goog || {};

  var log = global.goog.DEBUG ? console.debug.bind(console) : function() {};

  var idbDatabase;
  var IDB_VERSION = 1;
  var STOP_RETRYING_AFTER = 86400000; // One day, in milliseconds.
  var STORE_NAME = 'urls';

  /**
   * This is basic boilerplate for interacting with IndexedDB. Adapted from
   * https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
   *
   * @private
   */
  function openDatabaseAndReplayRequests() {
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
  }

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
   * `goog.useOfflineGoogleAnalytics` is the main entry point to the library
   * from within service worker code.
   * 
   * ```js
   * // Inside your service worker JavaScript file:
   * 
   * // Import the library into the service worker global scope:
   * // https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
   * importScripts('path/to/offline-google-analytics-import.js');
   *
   * // Call goog.useOfflineGoogleAnalytics() to activate the library.
   * goog.useOfflineGoogleAnalytics();
   * ```
   *
   * @alias goog.useOfflineGoogleAnalytics
   */
  global.goog.useOfflineGoogleAnalytics = function() {
    // Open the IndexedDB and check for requests to replay each time the service
    // worker starts up.
    // Since the service worker is terminated fairly frequently, it should start
    // up again for most page navigations. It also might start up if it's used
    // in a background sync or a push notification context.
    openDatabaseAndReplayRequests();

    global.addEventListener('fetch', function(event) {
      var url = new URL(event.request.url);

      if ((url.hostname === 'www.google-analytics.com' ||
        url.hostname === 'ssl.google-analytics.com') &&
        url.pathname === '/collect') {
        event.respondWith(
          fetch(event.request).then(function(response) {
            if (response.status >= 400) {
              throw Error('Error returned from Google Analytics request.');
            }

            return response;
          }).catch(function(error) {
            getObjectStore(STORE_NAME, 'readwrite').add({
              url: event.request.url,
              timestamp: Date.now()
            });

            return error;
          })
        );
      }
    });
  };
})(self);
