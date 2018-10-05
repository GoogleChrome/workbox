/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {CacheFirst} from '../../../packages/workbox-strategies/CacheFirst.mjs';
import {CacheOnly} from '../../../packages/workbox-strategies/CacheOnly.mjs';
import {NetworkFirst} from '../../../packages/workbox-strategies/NetworkFirst.mjs';
import {NetworkOnly} from '../../../packages/workbox-strategies/NetworkOnly.mjs';
import {StaleWhileRevalidate} from '../../../packages/workbox-strategies/StaleWhileRevalidate.mjs';
import {Router} from '../../../packages/workbox-routing/Router.mjs';
import {Route} from '../../../packages/workbox-routing/Route.mjs';

describe(`[workbox-strategies] Usages with Router`, function() {
  [CacheFirst, CacheOnly, NetworkFirst, NetworkOnly, StaleWhileRevalidate].forEach((StrategyClass) => {
    it(`should show Router and '${StrategyClass.name}' will work together`, function() {
      const router = new Router();
      router.registerRoute(new Route(() => true, new StrategyClass()));

      const request = new Request(self.location);
      const event = new FetchEvent('fetch', {request});
      return router.handleRequest({request, event});
    });
  });
});
