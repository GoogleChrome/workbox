importScripts('/__WORKBOX/buildFile/workbox-sw');

/* globals workbox */

workbox.routing.registerRoute(
  new RegExp('/test/workbox-strategies/static/cache-first/example.txt'),
  new workbox.strategies.CacheFirst(),
);

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
