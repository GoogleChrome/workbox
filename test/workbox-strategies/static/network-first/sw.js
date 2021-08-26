/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

importScripts('/__WORKBOX/buildFile/workbox-sw');
importScripts('/infra/testing/comlink/sw-interface.js');

workbox.setConfig({modulePathPrefix: '/__WORKBOX/buildFile/'});

workbox.routing.registerRoute(
  new RegExp('/__WORKBOX/uniqueValue'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'network-first',
  }),
);

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open('network-first')
      .then((cache) =>
        cache.put('/__WORKBOX/uniqueValue', new Response('Cached')),
      ),
  );
});
self.addEventListener('activate', (event) =>
  event.waitUntil(self.clients.claim()),
);
