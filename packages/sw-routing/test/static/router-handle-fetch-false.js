/* global goog */

importScripts('/packages/sw-routing/build/sw-routing.min.js');

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

const routes = [];

routes.push(new goog.routing.Route({
  match: ({url}) => url.pathname.endsWith('static'),
  handler: {
    handle: () => Promise.resolve(new Response('static response')),
  },
}));

routes.push(new goog.routing.Route({
  match: ({url}) => url.pathname.endsWith('throw-error'),
  handler: {
    handle: () => Promise.resolve().then(() => {
      throw new Error();
    }),
  },
}));

const defaultHandler = {
  handle: () => Promise.resolve(new Response('defaultHandler response')),
};

const catchHandler = {
  handle: () => Promise.resolve(new Response('catchHandler response')),
};

const router = new goog.routing.Router({
  handleFetch: false,
});
router.registerRoutes({routes});

router.setDefaultHandler({handler: defaultHandler});
router.setCatchHandler({handler: catchHandler});
