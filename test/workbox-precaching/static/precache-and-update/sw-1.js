/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

importScripts('/__WORKBOX/buildFile/workbox-core');
importScripts('/__WORKBOX/buildFile/workbox-precaching');
importScripts('messenger.js');
importScripts('/infra/testing/comlink/sw-interface.js');

workbox.precaching.precache([
  {
    url: 'styles/index.css',
    revision: '1',
  }, {
    url: 'index.html',
    revision: '1',
  },
]);

workbox.precaching.addRoute();

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
