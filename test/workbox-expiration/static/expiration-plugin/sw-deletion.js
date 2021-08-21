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

const expirationPlugin = new workbox.expiration.ExpirationPlugin({
  maxEntries: 1,
  purgeOnQuotaError: true,
});

const cacheName = 'expiration-plugin-deletion';

workbox.routing.registerRoute(
  /.*.txt/,
  new workbox.strategies.CacheFirst({
    cacheName,
    plugins: [expirationPlugin],
  }),
);

self.addEventListener('message', async (event) => {
  let message;

  if (event.data === 'delete') {
    try {
      await expirationPlugin.deleteCacheAndMetadata();
    } catch (error) {
      message = error.message;
    }
  }

  // Send all open clients a message indicating that deletion is done.
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage(message);
  }
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
