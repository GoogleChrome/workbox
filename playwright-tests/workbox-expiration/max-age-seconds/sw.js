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

workbox.routing.registerRoute(
  ({url}) => url.pathname.endsWith('.txt'),
  new workbox.strategies.CacheFirst({
    cacheName: self.registration.scope,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 1,
      }),
      self.__notifyOnCompletionPlugin,
    ],
  }),
);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
