/* global goog */

importScripts('/__test/bundle/sw-routing');

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

const route = new goog.routing.NavigationRoute({
  whitelist: [new RegExp('navigation$')],
  handler: {
    handle: () => Promise.resolve(new Response('navigation response')),
  },
});

const router = new goog.routing.Router();
router.registerRoute({route});
