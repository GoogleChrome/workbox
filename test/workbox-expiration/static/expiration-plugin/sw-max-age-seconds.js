/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

importScripts('/__WORKBOX/buildFile/workbox-core');
importScripts('/__WORKBOX/buildFile/workbox-expiration');
importScripts('/__WORKBOX/buildFile/workbox-routing');
importScripts('/__WORKBOX/buildFile/workbox-strategies');
importScripts('/infra/testing/comlink/sw-interface.js');

workbox.routing.registerRoute(
  /.*.txt/,
  new workbox.strategies.CacheFirst({
    cacheName: 'expiration-plugin-max-age-seconds',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 1,
      }),
    ],
  }),
);

self.addEventListener('install', (event) =>
  event.waitUntil(self.skipWaiting()),
);
self.addEventListener('activate', (event) =>
  event.waitUntil(self.clients.claim()),
);
