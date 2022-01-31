/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

importScripts('/__WORKBOX/buildFile/workbox-core');
importScripts('/__WORKBOX/buildFile/workbox-cacheable-response');
importScripts('/__WORKBOX/buildFile/workbox-routing');
importScripts('/__WORKBOX/buildFile/workbox-strategies');

const notifyOnCompletion = {
  handlerDidComplete: async ({event, request}) => {
    const client = await self.clients.get(event.clientId);
    client.postMessage({handlerDidComplete: request.url});
  },
};

workbox.routing.registerRoute(
  ({url}) => url.pathname.includes('cacheable-404'),
  new workbox.strategies.CacheFirst({
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [404],
      }),
      notifyOnCompletion,
    ],
  }),
);

workbox.routing.registerRoute(
  ({url}) => url.pathname.endsWith('.txt'),
  new workbox.strategies.CacheFirst({
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [200],
      }),
      notifyOnCompletion,
    ],
  }),
);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
