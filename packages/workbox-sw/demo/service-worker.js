/* global goog */

importScripts('../build/workbox-sw.js');
importScripts('./manifest.123456.js');

const swlib = new goog.SWLib();
swlib.precache(self.__file_manifest);

// Specific URL defined with a string.
swlib.router.registerRoute('/example/',
  swlib.strategies.staleWhileRevalidate());

// A regular expression to catch a range of strings.
// These only need to match part of the URL.
swlib.router.registerRoute(
  /\/images\/(.*\/)?.*\.(png|jpg|jpeg|gif)/,
  swlib.cacheFirst()
);

// Use express style routes to capture URLs
swlib.router.registerRoute('/styles/:filename', swlib.strategies.cacheFirst());

// Define routes with custom cache expiration
swlib.router.registerRoute('/demo/example-with-cache-expiration/',
  swlib.strategies.staleWhileRevalidate({
    cacheName: 'cache-with-expiration',
    cacheExpiration: {
      maxEntries: 10,
      maxAgeSeconds: 60,
    },
  }));

// To cache third party content that doesn't support CORS, allow '0' status code
swlib.router.registerRoute(
  /https:\/\/fonts.googleapis.com\/css?family=Slabo+27px/,
  swlib.strategies.staleWhileRevalidate({
    cacheName: 'cacheable-responses',
    cacheableResponse: {
      statuses: [0, 200],
    },
  }));
