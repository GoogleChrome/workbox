/* global goog */

importScripts('/__test/bundle/workbox-sw');

const SHELL_URL = '/shell';
const CACHE_NAME = 'navigation-route-e2e';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.put(SHELL_URL, new Response('navigation')))
  );
});

self.addEventListener('activate', () => self.clients.claim());

const swlib = new goog.SWLib();
swlib.router.registerNavigationRoute(SHELL_URL, {
  blacklist: [/blacklisted/],
  cacheName: CACHE_NAME,
});
