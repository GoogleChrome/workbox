/* eslint-env worker, serviceworker */
/* global goog */

// Import the helper libraries into our service worker's global scope.
importScripts(
  // This provides the goog.routing.* interfaces.
  '../../workbox-routing/build/workbox-routing.js',
  // This provides the goog.runtimeCaching.* interfaces.
  '../../workbox-runtime-caching/build/workbox-runtime-caching.js',
  // This provides the goog.cacheExpiration.* interfaces.
  '../../workbox-cache-expiration/build/workbox-cache-expiration.js'
);

// Have the service worker take control as soon as possible.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Configure a RequestWrapper to use a specific cache and impose a cache
// expiration when it modifies that cache.
const textFilesRequestWrapper = new goog.runtimeCaching.RequestWrapper({
  cacheName: 'text-files',
  plugins: [
    new goog.cacheExpiration.Plugin({
      maxEntries: 2,
      maxAgeSeconds: 10,
    }),
  ],
});

// Create a route to match all requests for URLs that end in .txt.
// Anything that matches those requests will be handled using a
// stale-while-revalidate policy, with caching plugin determined by the
// textFilesRequestWrapper we just created.
const textFilesRoute = new goog.routing.RegExpRoute({
  regExp: /\.txt$/,
  handler: new goog.runtimeCaching.StaleWhileRevalidate({
    requestWrapper: textFilesRequestWrapper,
  }),
});

// Finally, set up our router, registering both the textFilesRoute and also
// a default handler to match all other requests, using a network first policy.
const router = new goog.routing.Router();
router.registerRoute({route: textFilesRoute});
router.setDefaultHandler({handler: new goog.runtimeCaching.NetworkFirst()});
