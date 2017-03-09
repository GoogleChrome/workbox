/* global goog */

importScripts('../build/sw-lib.js');
importScripts('./manifest.123456.js');

goog.swlib.cacheRevisionedAssets(self.__file_manifest);

// Specific URL defined with a string.
goog.swlib.router.registerRoute('/example/', goog.swlib.staleWhileRevalidate());

// A regular expression to catch a range of strings.
// These only need to match part of the URL.
goog.swlib.router.registerRoute(
  /\/images\/(.*\/)?.*\.(png|jpg|jpeg|gif)/,
  goog.swlib.cacheFirst()
);

// Use express style routes to capture URLs
goog.swlib.router.registerRoute('/styles/:filename', goog.swlib.cacheFirst());

// Define routes with custom cache expiration
goog.swlib.router.registerRoute('/demo/example-with-cache-expiration/',
  goog.swlib.staleWhileRevalidate({
    cacheName: 'cache-with-expiration',
    cacheExpiration: {
      maxEntries: 10,
      maxAgeSeconds: 60,
    },
  }));

// To cache third party content that doesn't support CORS, allow '0' status code
goog.swlib.router.registerRoute(
  /https:\/\/fonts.googleapis.com\/css?family=Slabo+27px/,
  goog.swlib.staleWhileRevalidate({
    cacheName: 'cacheable-responses',
    cacheableResponse: {
      statuses: [0, 200],
    },
  }));
