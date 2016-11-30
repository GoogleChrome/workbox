/* eslint-env worker, serviceworker */
/* global goog */

importScripts(
  '../../sw-routing/build/sw-routing.min.js',
  '../../sw-runtime-caching/build/sw-runtime-caching.min.js',
  '../build/sw-cache-expiration.min.js'
);

// Have the service worker take control as soon as possible.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

const cacheName = 'text-files';
const requestWrapper = new goog.runtimeCaching.RequestWrapper({
  cacheName,
  behaviors: [
    new goog.cacheExpiration.Behavior({
      cacheName,
      maxEntries: 2,
      maxAgeSeconds: 10
    }),
  ],
});

const route = new goog.routing.RegExpRoute({
  regExp: /\.txt$/,
  handler: new goog.runtimeCaching.StaleWhileRevalidate({requestWrapper}),
});

const router = new goog.routing.Router();
router.registerRoute({route});
router.setDefaultHandler({handler: new goog.runtimeCaching.NetworkFirst()});
