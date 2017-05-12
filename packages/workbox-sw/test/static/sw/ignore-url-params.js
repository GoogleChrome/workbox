/* global goog */

importScripts('/__test/bundle/workbox-sw');
importScripts('/packages/workbox-precaching/test/static/skip-and-claim.js');

const swlib = new goog.SWLib();
swlib.precache([
  '/__echo/date/hello',
]);

// workbox-sw should define a route just for the revisioned assets so this
// fetch should never be called.
self.addEventListener('fetch', (event) => {
  event.respondWith(null);
});
