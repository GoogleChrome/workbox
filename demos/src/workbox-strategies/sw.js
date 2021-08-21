importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js',
);
// To avoid async issues, we load strategies before we call it in the event listener
workbox.loadModule('workbox-strategies');
// Note: Ignore the error that Glitch raises about workbox being undefined.
workbox.setConfig({
  debug: true,
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  switch (new URL(event.request.url).pathname) {
    case '/cache-only-empty-cache.txt': {
      const cacheOnlyEmpty = new workbox.strategies.CacheOnly();
      event.respondWith(cacheOnlyEmpty.handle({event, request}));
      break;
    }
    case '/cache-only-populated-cache': {
      const cacheOnlyPopulated = new workbox.strategies.CacheOnly();
      event.respondWith(cacheOnlyPopulated.handle({event, request}));
      break;
    }
    case '/cache-first.txt': {
      const cacheFirst = new workbox.strategies.CacheFirst();
      event.respondWith(cacheFirst.handle({event, request}));
      break;
    }
    case '/network-only.txt': {
      const networkOnly = new workbox.strategies.NetworkOnly();
      event.respondWith(networkOnly.handle({event, request}));
      break;
    }
    case '/network-first.txt': {
      const networkFirst = new workbox.strategies.NetworkFirst();
      event.respondWith(networkFirst.handle({event, request}));
      break;
    }
    case '/network-first-404.txt': {
      const networkFirstInvalid = new workbox.strategies.NetworkFirst();
      event.respondWith(networkFirstInvalid.handle({event, request}));
      break;
    }
    case '/stale-while-revalidate.txt': {
      const staleWhileRevalidate =
        new workbox.strategies.StaleWhileRevalidate();
      event.respondWith(staleWhileRevalidate.handle({event, request}));
      break;
    }
  }
});

// This immediately deploys the service worker w/o requiring a refresh
workbox.core.skipWaiting();
workbox.core.clientsClaim();

// Populate the cache to illustrate cache-only-populated-cache route
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(workbox.core.cacheNames.runtime).then((cache) => {
      return cache.put(
        new Request('/cache-only-populated-cache'),
        new Response('Hello from the populated cache.'),
      );
    }),
  );
});
