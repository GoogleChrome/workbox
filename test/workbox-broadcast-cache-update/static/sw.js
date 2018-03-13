importScripts('/__WORKBOX/buildFile/workbox-core');
importScripts('/__WORKBOX/buildFile/workbox-broadcast-cache-update');
importScripts('/__WORKBOX/buildFile/workbox-routing');
importScripts('/__WORKBOX/buildFile/workbox-strategies');

const cacheName = 'bcu-integration-test';

workbox.routing.registerRoute(
  new RegExp('/test/uniqueETag$'),
  workbox.strategies.staleWhileRevalidate({
    cacheName,
    plugins: [
      new workbox.broadcastUpdate.Plugin('bcu-integration-test'),
    ],
  })
);

self.addEventListener('install', (event) => {
  // Pre-populate the cache.
  event.waitUntil(caches.open(cacheName)
    .then((cache) => cache.add('/test/uniqueETag')));
  self.skipWaiting();
});
self.addEventListener('activate', () => self.clients.claim());
