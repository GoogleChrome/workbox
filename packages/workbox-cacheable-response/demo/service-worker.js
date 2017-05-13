/* eslint-env worker, serviceworker */
/* global workbox */

// Import the helper libraries into our service worker's global scope.
importScripts(
  // This provides the workbox.routing.* interfaces.
  '../../workbox-routing/build/workbox-routing.js',
  // This provides the workbox.runtimeCaching.* interfaces.
  '../../workbox-runtime-caching/build/workbox-runtime-caching.js',
  // This provides the workbox.cacheExpiration.* interfaces.
  '../../workbox-cacheable-response/build/workbox-cacheable-response.js'
);

// Have the service worker take control as soon as possible.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Configure a RequestWrapper to use a specific cache and only cache responses
// that have a status code of 200 or 404.
const httpbinRequestWrapper = new workbox.runtimeCaching.RequestWrapper({
  cacheName: 'httpbin',
  plugins: [
    new workbox.cacheableResponse.Plugin({
      statuses: [200, 404],
    }),
  ],
});

// Create a route to match all requests for https://httpbin.org/status/ URLs.
// Anything that matches those requests will be handled using a
// stale-while-revalidate policy, with caching behavior determined by the
// httpbinRequestWrapper we just created.
const httpbinRoute = new workbox.routing.RegExpRoute({
  regExp: new RegExp('^https://httpbin.org/status/'),
  handler: new workbox.runtimeCaching.StaleWhileRevalidate({
    requestWrapper: httpbinRequestWrapper,
  }),
});

// Finally, set up our router, registering both the textFilesRoute and also
// a default handler to match all other requests, using a network first policy.
const router = new workbox.routing.Router();
router.registerRoute({route: httpbinRoute});
router.setDefaultHandler({handler: new workbox.runtimeCaching.NetworkFirst()});
