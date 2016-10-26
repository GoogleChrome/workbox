/* eslint-env worker, serviceworker */
/* global goog */

importScripts(
  '../build/routing.min.js',
  '../../sw-runtime-caching/build/runtime-caching.min.js',
  '../../sw-broadcast-cache-update/build/broadcast-cache-update.min.js'
);

// Have the service worker take control as soon as possible.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

const cacheWrapper = new goog.runtimeCaching.CacheWrapper({
  name: 'text-files',
  behaviors: [
    new goog.broadcastCacheUpdate.Behavior({channelName: 'cache-updates'})
  ]
});

const route = new goog.routing.RegExpRoute({
  regExp: /\.txt$/,
  handler: new goog.runtimeCaching.StaleWhileRevalidate({cacheWrapper}),
});

const router = new goog.routing.Router();
router.registerRoute({route});
router.setDefaultHandler({handler: new goog.runtimeCaching.NetworkFirst()});
