importScripts('/__WORKBOX/buildFile/workbox-core');
importScripts('/__WORKBOX/buildFile/workbox-broadcast-cache-update');
importScripts('/__WORKBOX/buildFile/workbox-routing');
importScripts('/__WORKBOX/buildFile/workbox-strategies');

workbox.routing.registerRoute(
  new RegExp('/test/uniqueETag$'),
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'bcu-integration-test',
    plugins: [
      new workbox.broadcastUpdate.Plugin('bcu-integration-test'),
    ],
  })
);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
