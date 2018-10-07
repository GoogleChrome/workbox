/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

importScripts('/__WORKBOX/buildFile/workbox-core');
importScripts('/__WORKBOX/buildFile/workbox-broadcast-cache-update');
importScripts('/__WORKBOX/buildFile/workbox-routing');
importScripts('/__WORKBOX/buildFile/workbox-strategies');

const cacheName = 'bcu-integration-test';

workbox.routing.registerRoute(
    new RegExp('/__WORKBOX/uniqueETag$'),
    workbox.strategies.staleWhileRevalidate({
      cacheName,
      plugins: [
        new workbox.broadcastUpdate.Plugin(),
      ],
    })
);

self.addEventListener('install', (event) => {
  // Pre-populate the cache.
  event.waitUntil(caches.open(cacheName)
      .then((cache) => cache.add('/__WORKBOX/uniqueETag')));
  self.skipWaiting();
});
self.addEventListener('activate', () => self.clients.claim());
