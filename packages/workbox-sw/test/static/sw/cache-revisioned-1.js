/* global goog */

importScripts('/__test/bundle/sw-lib');
importScripts('/packages/workbox-precaching/test/static/skip-and-claim.js');
importScripts('/packages/workbox-precaching/test/static/test-data.js');
importScripts('/packages/sw-lib/test/static/test-data.js');

const testSet = self.goog.__TEST_DATA['sw-lib']['revisioned'];
const swlib = new goog.SWLib();
swlib.precache(testSet['set-1']);

swlib.precache(testSet['set-2']);

swlib.precache(testSet['set-3']);

// sw-lib should define a route just for the revisioned assets so this
// fetch should never be called.
self.addEventListener('fetch', (event) => {
  event.respondWith(null);
});
