/* eslint-env worker, serviceworker */
/* global goog */

/* eslint-disable max-len */
importScripts('../node_modules/sw-appcache-behavior/build/appcache-behavior-import.js');
/* eslint-enable max-len */

self.addEventListener('fetch', (event) => {
  event.respondWith(goog.appCacheBehavior.fetch(event));
});
