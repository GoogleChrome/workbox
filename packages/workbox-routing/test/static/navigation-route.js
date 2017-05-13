/* global workbox */

importScripts('/__test/bundle/workbox-routing');

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

const route = new workbox.routing.NavigationRoute({
  whitelist: [new RegExp('navigation$')],
  handler: {
    handle: () => Promise.resolve(new Response('navigation response')),
  },
});

const router = new workbox.routing.Router();
router.registerRoute({route});
