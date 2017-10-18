import CacheFirst from '../../../packages/workbox-runtime-caching/CacheFirst.mjs';
import CacheOnly from '../../../packages/workbox-runtime-caching/CacheOnly.mjs';
import NetworkFirst from '../../../packages/workbox-runtime-caching/NetworkFirst.mjs';
import NetworkOnly from '../../../packages/workbox-runtime-caching/NetworkOnly.mjs';
import StaleWhileRevalidate from '../../../packages/workbox-runtime-caching/StaleWhileRevalidate.mjs';
import Router from '../../../packages/workbox-routing/Router.mjs';
import Route from '../../../packages/workbox-routing/Route.mjs';

describe(`[workbox-runtime-caching] Usages with Router`, function() {
  [CacheFirst, CacheOnly, NetworkFirst, NetworkOnly, StaleWhileRevalidate].forEach((StrategyClass) => {
    it(`should show Router and '${StrategyClass.name}' will work together`, function() {
      const router = new Router();
      router.registerRoute(new Route(() => true, new StrategyClass()));
      return router.handleRequest(new FetchEvent('fetch', {
        request: new Request(self.location),
      }));
    });
  });
});
