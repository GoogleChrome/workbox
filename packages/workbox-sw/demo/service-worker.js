/* global workbox */

importScripts('../build/workbox-sw.js');
importScripts('./manifest.123456.js');

const workboxSW = new WorkboxSW();
workboxSW.precache(self.__file_manifest);

// Specific URL defined with a string.
workboxSW.router.registerRoute('/example/',
  workboxSW.strategies.staleWhileRevalidate());

// A regular expression to catch a range of strings.
// These only need to match part of the URL.
workboxSW.router.registerRoute(
  /\/images\/(.*\/)?.*\.(png|jpg|jpeg|gif)/,
  workboxSW.cacheFirst()
);

// Use express style routes to capture URLs
workboxSW.router.registerRoute('/styles/:filename',
  workboxSW.strategies.cacheFirst());

// Define routes with custom cache expiration
workboxSW.router.registerRoute('/demo/example-with-cache-expiration/',
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: 'cache-with-expiration',
    cacheExpiration: {
      maxEntries: 10,
      maxAgeSeconds: 60,
    },
  }));

// To cache third party content that doesn't support CORS, allow '0' status code
workboxSW.router.registerRoute(
  /https:\/\/fonts.googleapis.com\/css?family=Slabo+27px/,
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: 'cacheable-responses',
    cacheableResponse: {
      statuses: [0, 200],
    },
  }));
