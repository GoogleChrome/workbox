importScripts('/__WORKBOX/buildFile/workbox-sw');
importScripts('/infra/testing/comlink/sw-interface.js');

workbox.routing.registerRoute(
    new RegExp('/__WORKBOX/uniqueValue'),
    workbox.strategies.networkFirst({
      cacheName: 'network-first',
    })
);

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
      caches.open('network-first')
          .then((cache) => cache.put('/__WORKBOX/uniqueValue', new Response('Cached')))
  );
});
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
