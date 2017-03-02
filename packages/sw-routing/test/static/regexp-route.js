/* global goog */

importScripts('/packages/sw-routing/build/sw-routing.min.js');

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

const routes = [];

routes.push(new goog.routing.RegExpRoute({
  regExp: new RegExp('static$'),
  handler: {
    handle: () => Promise.resolve(new Response('static response')),
  },
}));

routes.push(new goog.routing.RegExpRoute({
  regExp: new RegExp('/echo3/1st/(\\w+)/2nd/(\\w+)/3rd/(\\w+)'),
  handler: {
    handle: ({params}) => Promise.resolve(
      new Response(JSON.stringify(params), {
        headers: {'content-type': 'application/json'},
      })
    ),
  },
}));

const router = new goog.routing.Router();
router.registerRoutes({routes});
