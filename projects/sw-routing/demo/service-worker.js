/* eslint-env worker, serviceworker */
/* global goog */

importScripts(
  '../build/routing.js',
  '../../sw-runtime-caching/build/runtime-caching.js',
  '../../sw-cache-update-notification/build/cache-update-notification.js'
);

// Have the service worker take control as soon as possible.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

const routes = [
  new goog.routing.Route({
    when: goog.routing.predicates.extensionIsOneOf(['txt']),
    handler: goog.runtimeCaching.staleWhileRevalidate,
    configuration: [
      new goog.cacheUpdateNotification.Behavior({channelName: 'cache-updates'})
    ]
  })
];

goog.routing.registerRoutes({routes});
