importScripts('/__WORKBOX/buildFile/workbox-core');
importScripts('/__WORKBOX/buildFile/workbox-precaching');
importScripts('messenger.js');

/* globals workbox */

workbox.precaching.precache([
  {
    url: 'index.html',
    revision: '2',
  }, {
    url: 'new-request.txt',
    revision: '2',
  },
]);

workbox.precaching.addRoute();

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
