importScripts('/__WORKBOX/buildFile/workbox-sw');

/* globals workbox */

workbox.routing.registerRoute(
  new RegExp('/CacheOnly/.*/'),
  new workbox.strategies.CacheOnly(),
);

self.addEventListener('install', (event) => event.waitUntil(
  caches.open(workbox.core.cacheNames.runtime)
  .then((cache) => cache.put('/CacheOnly/InCache/', new Response('Cached')))
  .then(() => self.skipWaiting()))
);
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
