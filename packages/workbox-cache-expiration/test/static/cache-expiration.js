importScripts('/__test/bundle/workbox-runtime-caching');
importScripts('/__test/bundle/workbox-cache-expiration');

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

const cacheExpirationPlugin= new workbox.cacheExpiration.CacheExpirationPlugin({
  maxEntries: 5,
});
const requestWrapper = new workbox.runtimeCaching.RequestWrapper({
  cacheName: 'cache-expiration',
  plugins: [cacheExpirationPlugin],
});
const handler = new workbox.runtimeCaching.CacheFirst({
  requestWrapper,
  waitOnCache: true,
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/__echo/counter')) {
    event.respondWith(handler.handle({event}));
  }
});
