/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

importScripts('/__WORKBOX/buildFile/workbox-core');
importScripts('/__WORKBOX/buildFile/workbox-navigation-preload');
importScripts('/__WORKBOX/buildFile/workbox-routing');
importScripts('/__WORKBOX/buildFile/workbox-strategies');

workbox.navigationPreload.enable();

workbox.routing.registerRoute(
  ({request}) => request.mode === 'navigate',
  new workbox.strategies.NetworkOnly({
    plugins: [
      {
        // If navigation preload works, requestWillFetch will not be set.
        requestWillFetch: async ({request, state}) => {
          state.requestWillFetch = true;
          return request;
        },
        handlerDidComplete: async ({state}) => {
          const clients = await self.clients.matchAll();
          for (const client of clients) {
            client.postMessage(state);
          }
        },
      },
    ],
  }),
);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
