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
  new RegExp('/CacheOnly/.*/'),
  new workbox.strategies.CacheOnly(),
);

self.addEventListener('install', (event) =>
  event.waitUntil(
    caches
      .open(workbox.core.cacheNames.runtime)
      .then((cache) => cache.put('/CacheOnly/InCache/', new Response('Cached')))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener('activate', (event) =>
  event.waitUntil(self.clients.claim()),
);
