importScripts('/__WORKBOX/buildFile/workbox-core');
importScripts('/__WORKBOX/buildFile/workbox-range-requests');
importScripts('/__WORKBOX/buildFile/workbox-routing');
importScripts('/__WORKBOX/buildFile/workbox-strategies');

workbox.routing.registerRoute(
  new RegExp('this-file-doesnt-exist\\.txt$'),
  workbox.strategies.cacheOnly({
    cacheName: 'range-requests-integration-test',
    plugins: [
      new workbox.rangeRequests.Plugin(),
    ],
  })
);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
