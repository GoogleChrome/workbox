/* eslint-env worker, serviceworker */
/* global goog */

importScripts('../build/routing.js', '../../sw-runtime-caching/build/runtime-caching.js', '../../sw-cache-expiration/build/cache-expiration.js');

// Have the service worker take control as soon as possible.
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(goog.runtimeCaching.defaultCacheName)
      .then(cache => cache.add('offline.html'))
  );
});
self.addEventListener('activate', () => self.clients.claim());

const routes = [
  new goog.routing.Route({
    when: ({event}) => event.request.mode === 'navigate',
    handler: ({event}) => {
      return fetch(event.request).catch(() => caches.match('offline.html'));
    }
  })
];

const defaultRoute = new goog.routing.Route({
  handler: goog.runtimeCaching.networkFirst,
  configuration: [new goog.cacheExpiration.Configuration({cacheName: 'testing', maxAgeSeconds: 1})]
});

goog.routing.registerRoutes({routes, defaultRoute});
