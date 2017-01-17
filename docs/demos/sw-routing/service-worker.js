/* eslint-env worker, serviceworker */
/* global goog */

importScripts(
  '../node_modules/sw-routing/build/sw-routing.min.js',
  '../node_modules/sw-runtime-caching/build/sw-runtime-caching.min.js'
);

// Have the service worker take control as soon as possible.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

const route = new goog.routing.ExpressRoute({
  path: '/packages/:project/demo/:file',
  handler: {
    handle: ({event, params}) => {
      console.log('The matching params are', params);
      return fetch(event.request);
    },
  },
});

const router = new goog.routing.Router();
router.registerRoute({route});
