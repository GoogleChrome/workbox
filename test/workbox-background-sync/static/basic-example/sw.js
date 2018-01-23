importScripts('/__WORKBOX/buildFile/workbox-core');
importScripts('/__WORKBOX/buildFile/workbox-background-sync');

/* globals workbox */

const queue = new workbox.backgroundSync.Queue('myQueueName');

self.addEventListener('fetch', (event) => {
  const pathname = new URL(event.request.url).pathname;
  if (pathname === '/test/workbox-background-sync/static/basic-example/example.txt') {
    queue.addRequest(event.request);
    event.respondWith(Promise.resolve(new Response(`Added to BG Sync`)));
  }
});

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
