/* eslint-env worker, serviceworker */
/* global goog */

importScripts('../node_modules/sw-appcache-behavior/build/appcache-behavior-import.js');

self.addEventListener('fetch', (event) => {
  event.respondWith(goog.appCacheBehavior.fetch(event));
});
