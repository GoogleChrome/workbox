importScripts('/__WORKBOX/buildFile/workbox-sw');

/* globals workbox */

workbox.routing.registerRoute(
  new RegExp('/test/uniqueValue'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'network-first',
  }),
);

self.addEventListener('install', (event) => event.waitUntil(
  caches.open('network-first')
  .then((cache) => cache.put('/test/uniqueValue', new Response('Cached')))
  .then(() => self.skipWaiting()))
);
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
