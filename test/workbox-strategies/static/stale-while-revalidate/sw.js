importScripts('/__WORKBOX/buildFile/workbox-sw');

/* globals workbox */

workbox.routing.registerRoute(
  new RegExp('/test/uniqueValue'),
  new workbox.strategies.StaleWhileRevalidate(
    {
      cacheName: 'stale-while-revalidate',
    }
  ),
);

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
