/* global workbox */

importScripts('/__test/bundle/workbox-sw');
importScripts('/packages/workbox-precaching/test/static/skip-and-claim.js');
importScripts('/packages/workbox-precaching/test/static/test-data.js');
importScripts('/packages/workbox-sw/test/static/test-data.js');

const testSet = self.workbox.__TEST_DATA['workbox-sw']['revisioned'];
const workboxSW = new WorkboxSW();
workboxSW.precache(testSet['set-1']);

workboxSW.precache(testSet['set-2']);

workboxSW.precache(testSet['set-3']);

// workbox-sw should define a route just for the revisioned assets so this
// fetch should never be called.
self.addEventListener('fetch', (event) => {
  event.respondWith(null);
});
