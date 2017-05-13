/* eslint-env worker, serviceworker */
/* global workbox */

importScripts(
  '../../workbox-routing/build/workbox-routing.js',
  '../../workbox-runtime-caching/build/workbox-runtime-caching.js',
  '../../workbox-broadcast-cache-update/build/workbox-broadcast-cache-update.js'
);

// Have the service worker take control as soon as possible.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

const requestWrapper = new workbox.runtimeCaching.RequestWrapper({
  cacheName: 'text-files',
  plugins: [
    new workbox.broadcastCacheUpdate.BroadcastCacheUpdatePlugin(
      {channelName: 'cache-updates'}),
  ],
});

const route = new workbox.routing.RegExpRoute({
  regExp: /\.txt$/,
  handler: new workbox.runtimeCaching.StaleWhileRevalidate({requestWrapper}),
});

const router = new workbox.routing.Router();
router.registerRoute({route});
router.setDefaultHandler({handler: new workbox.runtimeCaching.NetworkFirst(
  {networkTimeoutSeconds: 10})});
