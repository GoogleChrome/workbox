/* global goog */
importScripts('/packages/sw-precaching/test/browser-unit/data/test-data.js');
importScripts('/packages/sw-precaching/build/sw-precaching.min.js');
importScripts('/packages/sw-precaching/test/browser-unit/data/skip-and-claim.js');

const precacheManager = new goog.precaching.PrecacheManager();
precacheManager.cacheUnrevisioned({
  unrevisionedFiles: goog.__TEST_DATA['redirect'],
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request));
});
