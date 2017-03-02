/* global goog */

importScripts('/packages/sw-lib/build/sw-lib.min.js');
importScripts('/packages/sw-precaching/test/static/skip-and-claim.js');
importScripts('/packages/sw-precaching/test/static/test-data.js');
importScripts('/packages/sw-lib/test/static/test-data.js');

const testSet = self.goog.__TEST_DATA['sw-lib']['unrevisioned'];
goog.swlib.warmRuntimeCache(testSet['set-4']);

goog.swlib.warmRuntimeCache(testSet['set-5']);

goog.swlib.warmRuntimeCache(testSet['set-6']);

// This allows tests to query the response from the SW.
self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request));
});
