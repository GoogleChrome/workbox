/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

importScripts('/__WORKBOX/buildFile/workbox-core');
importScripts('/__WORKBOX/buildFile/workbox-precaching');
importScripts('/infra/testing/comlink/sw-interface.js');

workbox.precaching.precache([
  {
    url: 'index.html',
    revision: '2',
  },
  'hashed-file.abcd1234.txt',
]);

workbox.precaching.addRoute();

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
