/* global goog */

importScripts('/packages/sw-lib/build/sw-lib.min.js');
importScripts('/packages/sw-precaching/test/static/skip-and-claim.js');

const swlib = new goog.SWLib({
  ignoreUrlParametersMatching: [/^example/, /.*test.*/],
});
swlib.precache([
  '/__echo/date/hello',
]);

// sw-lib should define a route just for the revisioned assets so this
// fetch should never be called.
self.addEventListener('fetch', (event) => {
  event.respondWith(null);
});
