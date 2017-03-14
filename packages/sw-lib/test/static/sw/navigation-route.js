/* global goog */

importScripts('/packages/sw-lib/build/sw-lib.min.js');

const SHELL_URL = '/shell';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open('navigation-route-e2e')
      .then((cache) => cache.put(SHELL_URL, new Response('navigation')))
  );
});

self.addEventListener('activate', () => self.clients.claim());

goog.swlib.router.registerNavigationRoute(SHELL_URL, {
  blacklist: [/blacklisted/],
});
