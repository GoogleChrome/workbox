/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {CacheFirst} from 'workbox-strategies/CacheFirst.mjs';
import {CacheOnly} from 'workbox-strategies/CacheOnly.mjs';
import {NetworkFirst} from 'workbox-strategies/NetworkFirst.mjs';
import {NetworkOnly} from 'workbox-strategies/NetworkOnly.mjs';
import {StaleWhileRevalidate} from 'workbox-strategies/StaleWhileRevalidate.mjs';
import {Router} from 'workbox-routing/Router.mjs';
import {Route} from 'workbox-routing/Route.mjs';
import {
  eventDoneWaiting,
  spyOnEvent,
} from '../../../infra/testing/helpers/extendable-event-utils.mjs';
import {generateUniqueResponse} from '../../../infra/testing/helpers/generateUniqueResponse.mjs';

describe(`Router`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(async function () {
    sandbox.restore();
    sandbox.stub(self, 'fetch').resolves(generateUniqueResponse());
    sandbox.stub(Cache.prototype, 'match').resolves(generateUniqueResponse());
  });

  after(async function () {
    sandbox.restore();
  });

  [
    CacheFirst,
    CacheOnly,
    NetworkFirst,
    NetworkOnly,
    StaleWhileRevalidate,
  ].forEach((StrategyClass) => {
    it(`should work with the '${StrategyClass.name}' strategy`, async function () {
      const router = new Router();
      router.registerRoute(new Route(() => true, new StrategyClass()));

      const request = new Request(self.location);
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      router.handleRequest({request, event});
      await eventDoneWaiting(event);
    });
  });
});
