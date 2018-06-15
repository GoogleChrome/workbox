importScripts('/__WORKBOX/buildFile/workbox-sw');
importScripts('/infra/testing/comlink/sw-interface.js');

workbox.routing.registerRoute(
  new RegExp('/test/workbox-strategies/static/cache-first/example.txt'),
  workbox.strategies.cacheFirst()
);

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
