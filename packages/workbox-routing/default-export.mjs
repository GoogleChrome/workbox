import Router from './lib/Router.mjs';

const router = new Router();
// By default, register a fetch event listener that will respond to a request
// only if there's a matching route.
self.addEventListener('fetch', (event) => {
  const responsePromise = router.handleRequest(event);
  if (responsePromise) {
    event.respondWith(responsePromise);
  }
});

export default router;
