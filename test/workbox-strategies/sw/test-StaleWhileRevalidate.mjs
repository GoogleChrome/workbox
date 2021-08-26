/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cacheNames} from 'workbox-core/_private/cacheNames.mjs';
import {StaleWhileRevalidate} from 'workbox-strategies/StaleWhileRevalidate.mjs';
import {compareResponses} from '../../../infra/testing/helpers/compareResponses.mjs';
import {
  eventDoneWaiting,
  spyOnEvent,
} from '../../../infra/testing/helpers/extendable-event-utils.mjs';
import {generateOpaqueResponse} from '../../../infra/testing/helpers/generateOpaqueResponse.mjs';
import {generateUniqueResponse} from '../../../infra/testing/helpers/generateUniqueResponse.mjs';

describe(`StaleWhileRevalidate`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(async function () {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    sandbox.restore();
  });

  after(async function () {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    sandbox.restore();
  });

  describe(`handle()`, function () {
    it(`should add the initial response to the cache`, async function () {
      sandbox.stub(self, 'fetch').resolves(generateUniqueResponse());

      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const staleWhileRevalidate = new StaleWhileRevalidate();
      const handleResponse = await staleWhileRevalidate.handle({
        request,
        event,
      });

      await eventDoneWaiting(event);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const cachedResponse = await cache.match(request);

      await compareResponses(cachedResponse, handleResponse, true);
    });

    it(`should support using a string as the request`, async function () {
      sandbox.stub(self, 'fetch').resolves(generateUniqueResponse());

      const stringRequest = 'http://example.io/test/';
      const request = new Request(stringRequest);
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const staleWhileRevalidate = new StaleWhileRevalidate();
      const handleResponse = await staleWhileRevalidate.handle({
        request: stringRequest,
        event,
      });

      await eventDoneWaiting(event);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const cachedResponse = await cache.match(request);

      await compareResponses(cachedResponse, handleResponse, true);
    });

    it(`should return the cached response and not update the cache when the network request fails`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      sandbox.stub(self, 'fetch').rejects(new Error(`Inject Error`));

      const firstCachedResponse = new Response('response body');
      const cache = await caches.open(cacheNames.getRuntimeName());
      await cache.put(request, firstCachedResponse.clone());

      const staleWhileRevalidate = new StaleWhileRevalidate();

      const handleResponse = await staleWhileRevalidate.handle({
        request,
        event,
      });

      await eventDoneWaiting(event);

      await compareResponses(firstCachedResponse, handleResponse, true);
      const secondCachedResponse = await cache.match(request);
      await compareResponses(firstCachedResponse, secondCachedResponse, true);
    });

    it(`should return the cached response and update the cache when the network request succeeds`, async function () {
      sandbox.stub(self, 'fetch').resolves(generateUniqueResponse());

      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const firstCachedResponse = new Response('response body 1');
      const cache = await caches.open(cacheNames.getRuntimeName());
      await cache.put(request, firstCachedResponse.clone());

      const staleWhileRevalidate = new StaleWhileRevalidate();
      const handleResponse = await staleWhileRevalidate.handle({
        request,
        event,
      });

      await eventDoneWaiting(event);

      await compareResponses(firstCachedResponse, handleResponse, true);
      const secondCachedResponse = await cache.match(request);
      await compareResponses(firstCachedResponse, secondCachedResponse, false);
    });

    it(`should update the cache with an the opaque cross-origin network response`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const fetchResponse = await generateOpaqueResponse();
      sandbox.stub(self, 'fetch').resolves(fetchResponse);

      const staleWhileRevalidate = new StaleWhileRevalidate();
      const handleResponse = await staleWhileRevalidate.handle({
        request,
        event,
      });

      await eventDoneWaiting(event);

      expect(handleResponse.status).to.eql(0);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const cachedResponse = await cache.match(request);
      expect(cachedResponse.status).to.eql(0);
    });

    it(`should allow adding plugins to override cacheOkAndOpaque`, function () {
      const plugins = [
        {
          cacheWillUpdate: () => {},
        },
      ];
      const staleWhileRevalidate = new StaleWhileRevalidate({
        plugins,
      });
      expect(staleWhileRevalidate.plugins).to.equal(plugins);
    });

    it(`should use the fetchOptions provided`, async function () {
      const fetchOptions = {credentials: 'include'};
      const staleWhileRevalidate = new StaleWhileRevalidate({fetchOptions});

      const fetchStub = sandbox
        .stub(self, 'fetch')
        .resolves(generateUniqueResponse());
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      await staleWhileRevalidate.handle({
        request,
        event,
      });

      await eventDoneWaiting(event);

      expect(fetchStub.calledOnce).to.be.true;
      expect(fetchStub.calledWith(request, fetchOptions)).to.be.true;
    });

    it(`should use the CacheQueryOptions when performing a cache match`, async function () {
      sandbox.stub(self, 'fetch').resolves(generateUniqueResponse());

      const matchStub = sandbox
        .stub(self.caches.constructor.prototype, 'match')
        .resolves(generateUniqueResponse());

      const matchOptions = {ignoreSearch: true};
      const staleWhileRevalidate = new StaleWhileRevalidate({matchOptions});

      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      await staleWhileRevalidate.handle({
        request,
        event,
      });

      await eventDoneWaiting(event);

      expect(matchStub.callCount).to.equal(1);
      expect(matchStub.firstCall.args[0]).to.equal(request);
      expect(matchStub.firstCall.args[1].ignoreSearch).to.equal(true);
    });

    it(`should throw an error when the network request fails, and there's no cache match`, async function () {
      sandbox.stub(self, 'fetch').rejects(new Error('Injected error.'));

      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const staleWhileRevalidate = new StaleWhileRevalidate();
      await expectError(
        () =>
          staleWhileRevalidate.handle({
            request,
            event,
          }),
        'no-response',
      );

      await eventDoneWaiting(event);
    });
  });
});
