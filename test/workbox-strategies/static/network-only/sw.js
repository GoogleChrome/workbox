importScripts('/__WORKBOX/buildFile/workbox-sw');

/* globals workbox */

workbox.routing.registerRoute(
  new RegExp('/test/uniqueValue'),
  new workbox.strategies.NetworkOnly({
    cacheName: 'network-only',
  }),
);

self.addEventListener('install', (event) => event.waitUntil(
  caches.open('network-only')
  .then((cache) => cache.put('/test/uniqueValue', new Response('Cached')))
  .then(() => self.skipWaiting()))
);
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
