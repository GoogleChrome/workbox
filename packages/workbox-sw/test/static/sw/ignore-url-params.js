/* global goog */

importScripts('/__test/bundle/sw-lib');
importScripts('/packages/workbox-precaching/test/static/skip-and-claim.js');

const swlib = new goog.SWLib();
swlib.precache([
  '/__echo/date/hello',
]);

// sw-lib should define a route just for the revisioned assets so this
// fetch should never be called.
self.addEventListener('fetch', (event) => {
  event.respondWith(null);
});
