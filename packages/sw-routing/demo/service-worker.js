/* eslint-env worker, serviceworker */
/* global goog */

importScripts(
  '../../sw-routing/build/sw-routing.js',
  '../../sw-runtime-caching/build/sw-runtime-caching.js'
);

// Have the service worker take control as soon as possible.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const route = new goog.routing.ExpressRoute({
  path: '/packages/:project/demo/:file',
  handler: ({event, params}) => {
    console.log('The matching params are', params);
    return fetch(event.request);
  },
});

const router = new goog.routing.Router();
router.registerRoute({route});
