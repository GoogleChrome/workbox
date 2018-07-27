importScripts('/__WORKBOX/buildFile/workbox-sw');
importScripts('/infra/testing/comlink/sw-interface.js');

workbox.routing.registerRoute(
  new RegExp('/__WORKBOX/uniqueValue'),
  workbox.strategies.networkOnly({
    cacheName: 'network-only',
  }),
);

self.addEventListener('install', (event) => event.waitUntil(
  caches.open('network-only')
    .then((cache) => cache.put('/__WORKBOX/uniqueValue', new Response('Cached')))
    .then(() => self.skipWaiting()))
);
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
