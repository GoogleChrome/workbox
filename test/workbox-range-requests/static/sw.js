/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

importScripts('/__WORKBOX/buildFile/workbox-core');
importScripts('/__WORKBOX/buildFile/workbox-range-requests');
importScripts('/__WORKBOX/buildFile/workbox-routing');
importScripts('/__WORKBOX/buildFile/workbox-strategies');

const cacheName = 'range-requests-integration-test';
workbox.routing.registerRoute(
  new RegExp('this-file-doesnt-exist\\.txt$'),
  new workbox.strategies.CacheOnly({
    cacheName,
    plugins: [new workbox.rangeRequests.RangeRequestsPlugin()],
  }),
);

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.put(
        'this-file-doesnt-exist.txt',
        new Response('0123456789'),
      );
    }),
  );
});
self.addEventListener('activate', () => self.clients.claim());
