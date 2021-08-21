/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

importScripts('/__WORKBOX/buildFile/workbox-core');
importScripts('/__WORKBOX/buildFile/workbox-routing');

// Use the same handler for each route, which will create a new response whose
// body contains the original request URL.
const handler = ({url}) => new Response(url);

const routeObject = new workbox.routing.Route(
  ({url}) => url.pathname === '/routeObject',
  handler,
);
workbox.routing.registerRoute(routeObject);

workbox.routing.registerRoute('/sameOrigin', handler);

workbox.routing.registerRoute('https://example.com/crossOrigin', handler);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
