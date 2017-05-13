/* eslint-env worker, serviceworker */
/* global workbox */

importScripts(
  '../../workbox-routing/build/workbox-routing.js',
  '../../workbox-runtime-caching/build/workbox-runtime-caching.js'
);

// Have the service worker take control as soon as possible.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const route = new workbox.routing.ExpressRoute({
  path: '/packages/:project/demo/:file',
  handler: ({event, params}) => {
    console.log('The matching params are', params);
    return fetch(event.request);
  },
});

const router = new workbox.routing.Router();
router.registerRoute({route});
