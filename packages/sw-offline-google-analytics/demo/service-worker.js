/* eslint-env worker, serviceworker */
/* global goog */

const CACHE_NAME = 'runtime-caching';
self.goog = {DEBUG: true};
importScripts('../build/offline-google-analytics-import.js');

// First, enable the offline Google Analytics behavior.
// This will get "first shot" at responding to Google Analytics requests, before
// our catch-all fetch event listener can handle it.
goog.offlineGoogleAnalytics.initialize({
  parameterOverrides: {
    // Add in any additional parameters here, or omit this section to
    // replay the Google Analytics request without additional parameters.
    // See https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
    cd1: 'My Custom Dimension Value',
  },
});

// Use a basic network-first caching strategy as a catch-all for everything
// other than the Google Analytics requests.
// (In a real app, you'd want to use a more sophisticated caching technique.)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return fetch(event.request).then((response) => {
        return cache.put(event.request, response.clone()).then(() => response);
      }).catch(() => cache.match(event.request));
    })
  );
});

// Have the service worker take control as soon as possible.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
