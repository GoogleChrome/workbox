/* global goog */

importScripts('/packages/sw-routing/build/sw-routing.min.js');

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

const routes = [];

routes.push(new goog.routing.RegExpRoute({
  regExp: new RegExp('static$'),
  handler: {
    handle: () => Promise.resolve(new Response('static response')),
  },
}));

routes.push(new goog.routing.RegExpRoute({
  regExp: new RegExp('echo/(\\w+)$'),
  handler: {
    handle: ({params}) => Promise.resolve(new Response(params[0])),
  },
}));

const router = new goog.routing.Router();
router.registerRoutes({routes});
