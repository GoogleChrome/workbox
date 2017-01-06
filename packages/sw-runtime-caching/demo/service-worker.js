/* eslint-env worker, serviceworker */
/* global goog */

importScripts(
  '../../sw-routing/build/sw-routing.min.js',
  '../../sw-runtime-caching/build/sw-runtime-caching.min.js',
  '../../sw-broadcast-cache-update/build/sw-broadcast-cache-update.min.js'
);

// Have the service worker take control as soon as possible.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

const requestWrapper = new goog.runtimeCaching.RequestWrapper({
  cacheName: 'text-files',
  behaviors: [
    new goog.broadcastCacheUpdate.Behavior({channelName: 'cache-updates'}),
  ],
});

const route = new goog.routing.RegExpRoute({
  regExp: /\.txt$/,
  handler: new goog.runtimeCaching.StaleWhileRevalidate({requestWrapper}),
});

const router = new goog.routing.Router();
router.registerRoute({route});
router.setDefaultHandler({handler: new goog.runtimeCaching.NetworkFirst()});
