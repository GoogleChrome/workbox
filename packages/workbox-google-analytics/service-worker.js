/* eslint-disable */

self.goog = {DEBUG: true};
importScripts('./build/importScripts/workbox-google-analytics.dev.v1.3.0.js');

// First, enable the offline Google Analytics behavior.
// This will get "first shot" at responding to Google Analytics requests, before
// our catch-all fetch event listener can handle it.

self.doSync = () => {
  self.dispatchEvent(new SyncEvent('sync', {
    tag: 'SW_BACKGROUND_QUEUE_TAG_DEFAULT_QUEUE_0'
  }));
};

workbox.googleAnalytics.initialize({
  parameterOverrides: {
    // Add in any additional parameters here, or omit this section to
    // replay the Google Analytics request without additional parameters.
    // See https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
    cd1: new Date(),
  },
});

// Have the service worker take control as soon as possible.
self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
