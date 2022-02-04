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
importScripts('../../lib/sw/notifyOnCompletionPlugin.js');

const expirationPlugin = new workbox.expiration.ExpirationPlugin({
  maxEntries: 1,
  purgeOnQuotaError: true,
});

workbox.routing.registerRoute(
  ({url}) => url.pathname.endsWith('.txt'),
  new workbox.strategies.CacheFirst({
    cacheName: self.registration.scope,
    plugins: [expirationPlugin, self.__notifyOnCompletionPlugin],
  }),
);

self.addEventListener('message', async (event) => {
  let message = 'success';

  if (event.data === 'delete') {
    try {
      await expirationPlugin.deleteCacheAndMetadata();
    } catch (error) {
      message = error.message;
    }
  }

  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage(message);
  }
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
