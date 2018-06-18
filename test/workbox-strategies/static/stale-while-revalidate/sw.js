importScripts('/__WORKBOX/buildFile/workbox-sw');
importScripts('/infra/testing/comlink/sw-interface.js');

workbox.routing.registerRoute(
  new RegExp('/test/uniqueValue'),
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'stale-while-revalidate',
  })
);

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
