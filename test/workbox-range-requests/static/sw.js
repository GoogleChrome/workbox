importScripts('/__WORKBOX/buildFile/workbox-core');
importScripts('/__WORKBOX/buildFile/workbox-range-requests');
importScripts('/__WORKBOX/buildFile/workbox-routing');
importScripts('/__WORKBOX/buildFile/workbox-strategies');

const cacheName = 'range-requests-integration-test';
workbox.routing.registerRoute(
  new RegExp('this-file-doesnt-exist\\.txt$'),
  workbox.strategies.cacheOnly({
    cacheName,
    plugins: [
      new workbox.rangeRequests.Plugin(),
    ],
  })
);

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(cacheName).then((cache) => {
    return cache.put('this-file-doesnt-exist.txt', new Response('0123456789'));
  }));
});
self.addEventListener('activate', () => self.clients.claim());
