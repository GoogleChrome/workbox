importScripts('/__WORKBOX/buildFile/workbox-core');
importScripts('/__WORKBOX/buildFile/workbox-routing');

/* globals workbox */

workbox.routing.registerRoute(
  new workbox.routing.NavigationRoute(
    ({url}) => {
      return new Response(`NavigationRoute.${url.href}`);
    }
  )
);

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
