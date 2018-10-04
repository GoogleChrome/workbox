importScripts('/__WORKBOX/buildFile/workbox-sw');
importScripts('/infra/testing/comlink/sw-interface.js');

workbox.routing.registerRoute(
    new RegExp('/CacheOnly/.*/'),
    workbox.strategies.cacheOnly()
);

self.addEventListener('install', (event) => event.waitUntil(
    caches.open(workbox.core.cacheNames.runtime)
        .then((cache) => cache.put('/CacheOnly/InCache/', new Response('Cached')))
        .then(() => self.skipWaiting()))
);
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
