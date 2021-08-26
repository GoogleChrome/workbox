/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cacheNames} from 'workbox-core/_private/cacheNames.mjs';
import {NetworkFirst} from 'workbox-strategies/NetworkFirst.mjs';
import {compareResponses} from '../../../infra/testing/helpers/compareResponses.mjs';
import {
  eventDoneWaiting,
  spyOnEvent,
} from '../../../infra/testing/helpers/extendable-event-utils.mjs';
import {generateOpaqueResponse} from '../../../infra/testing/helpers/generateOpaqueResponse.mjs';
import {generateUniqueResponse} from '../../../infra/testing/helpers/generateUniqueResponse.mjs';
import {sleep} from '../../../infra/testing/helpers/sleep.mjs';

describe(`NetworkFirst`, function () {
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
    it(`should add the network response to the cache`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const fetchResponse = generateOpaqueResponse();
      sandbox.stub(self, 'fetch').resolves(fetchResponse);

      const networkFirst = new NetworkFirst();
      const handleResponse = await networkFirst.handle({
        request,
        event,
      });

      // Wait until cache.put is finished.
      await eventDoneWaiting(event);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const cachedResponse = await cache.match(request);

      await compareResponses(cachedResponse, handleResponse, true);
    });

    it(`should support using a string as the request`, async function () {
      const stringRequest = 'http://example.io/test/';
      const request = new Request(stringRequest);
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const fetchResponse = generateOpaqueResponse();
      sandbox.stub(self, 'fetch').resolves(fetchResponse);

      const networkFirst = new NetworkFirst();
      const handleResponse = await networkFirst.handle({
        request: stringRequest,
        event,
      });

      // Wait until cache.put is finished.
      await eventDoneWaiting(event);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const cachedResponse = await cache.match(request);

      await compareResponses(cachedResponse, handleResponse, true);
    });

    it(`should return the cached response if exists and not update the cache when the network request fails`, async function () {
      sandbox.stub(self, 'fetch').rejects(new Error('Injected error.'));

      const request = new Request('http://example.io/test/');
      const event1 = new FetchEvent('fetch', {request});
      const event2 = new FetchEvent('fetch', {request});
      const event3 = new FetchEvent('fetch', {request});
      spyOnEvent(event1);
      spyOnEvent(event2);
      spyOnEvent(event3);

      const networkFirst = new NetworkFirst();
      await expectError(
        () =>
          networkFirst.handle({
            request,
            event: event1,
          }),
        'no-response',
      );
      await eventDoneWaiting(event1);

      const injectedResponse = new Response('response body');
      const cache = await caches.open(cacheNames.getRuntimeName());
      await cache.put(request, injectedResponse.clone());

      const cachedResponse = await networkFirst.handle({
        request,
        event: event2,
      });
      await eventDoneWaiting(event2);
      await compareResponses(cachedResponse, injectedResponse, true);

      const secondCachedResponse = await networkFirst.handle({
        request,
        event: event3,
      });
      await eventDoneWaiting(event3);
      await compareResponses(cachedResponse, secondCachedResponse, true);
    });

    it(`should return the cached response if the network request times out`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      // Use a short timeout to not slow down the test.
      // Note Sinon fake timers do not work with `await timeout()` used
      // in the current `StrategyHandler` implementation.
      const networkTimeoutSeconds = 0.5;
      const sleepLongerThanNetworkTimeout = sleep(
        2 * networkTimeoutSeconds * 1000,
      );

      sandbox.stub(self, 'fetch').callsFake(async (req) => {
        await sleepLongerThanNetworkTimeout;
        return new Response('Timedout Response');
      });

      const networkFirst = new NetworkFirst({networkTimeoutSeconds});

      const injectedResponse = new Response('response body');
      const cache = await caches.open(cacheNames.getRuntimeName());
      await cache.put(request, injectedResponse.clone());

      const [handlePromise, donePromise] = networkFirst.handleAll({
        request,
        event,
      });

      await donePromise;

      const populatedCacheResponse = await handlePromise;
      await compareResponses(populatedCacheResponse, injectedResponse, true);
    });

    it(`should signal completion if the network request completes before timing out`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const networkTimeoutSeconds = 10;

      const injectedResponse = new Response('response body');
      sandbox.stub(self, 'fetch').resolves(injectedResponse);

      const networkFirst = new NetworkFirst({networkTimeoutSeconds});

      const [handlePromise, donePromise] = networkFirst.handleAll({
        request,
        event,
      });

      const startTime = performance.now();
      await donePromise;
      expect(performance.now() - startTime).to.be.below(1000);

      const populatedCacheResponse = await handlePromise;
      await compareResponses(populatedCacheResponse, injectedResponse, true);
    });

    it(`should return the network response if the timeout is exceeded, but there is no cached response`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      // Use a short timeout to not slow down the test.
      // Note Sinon fake timers do not work with `await timeout()` used
      // in the current `StrategyHandler` implementation.
      const networkTimeoutSeconds = 0.5;
      const sleepLongerThanNetworkTimeout = sleep(
        2 * networkTimeoutSeconds * 1000,
      );

      const networkResponse = new Response('from network');

      sandbox.stub(self, 'fetch').callsFake(async () => {
        await sleepLongerThanNetworkTimeout;
        return networkResponse;
      });

      sandbox.stub(caches, 'match').resolves(undefined);

      const networkFirst = new NetworkFirst({
        networkTimeoutSeconds,
      });
      const handlePromise = networkFirst.handle({
        request,
        event,
      });

      const handlerResponse = await handlePromise;

      expect(handlerResponse).to.equal(networkResponse);
      expect(caches.match.firstCall.args[0]).to.equal(request);
    });

    it(`should throw when NetworkFirst() is called with an invalid networkTimeoutSeconds parameter`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      return expectError(
        () => new NetworkFirst({networkTimeoutSeconds: 'invalid'}),
        'incorrect-type',
        (err) => {
          expect(err.details.paramName).to.deep.equal('networkTimeoutSeconds');
          expect(err.details.expectedType).to.deep.equal('number');
          expect(err.details.moduleName).to.deep.equal('workbox-strategies');
          expect(err.details.className).to.deep.equal('NetworkFirst');
          expect(err.details.funcName).to.deep.equal('constructor');
        },
      );
    });

    it(`should return the network response and update the cache when the network request succeeds`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const fetchResponse = generateOpaqueResponse();
      sandbox.stub(self, 'fetch').resolves(fetchResponse);

      const injectedResponse = generateUniqueResponse();
      const cache = await caches.open(cacheNames.getRuntimeName());
      await cache.put(request, injectedResponse.clone());

      const networkFirst = new NetworkFirst();

      const handleResponse = await networkFirst.handle({
        request,
        event,
      });

      // wait for cache.put
      await eventDoneWaiting(event);

      await compareResponses(injectedResponse, handleResponse, false);

      const currentCachedResponse = await cache.match(request);
      await compareResponses(handleResponse, currentCachedResponse, true);
    });

    it(`should update the cache with an the opaque cross-origin network response`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const fetchResponse = await generateOpaqueResponse();
      sandbox.stub(self, 'fetch').resolves(fetchResponse);

      const networkFirst = new NetworkFirst();
      const handleResponse = await networkFirst.handle({
        request,
        event,
      });
      expect(handleResponse.status).to.equal(0);

      await eventDoneWaiting(event);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const cachedResponse = await cache.match(request);

      expect(cachedResponse.status).to.equal(0);
    });

    it(`should not cache an opaque response if they add a custom plugin`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const fetchResponse = await generateOpaqueResponse();
      sandbox.stub(self, 'fetch').resolves(fetchResponse);

      const networkFirst = new NetworkFirst({
        plugins: [{cacheWillUpdate: () => null}],
      });

      const handleResponse = await networkFirst.handle({
        request,
        event,
      });
      expect(handleResponse.status).to.equal(0);

      await eventDoneWaiting(event);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const cachedResponse = await cache.match(request);
      expect(cachedResponse).to.not.exist;
    });

    it(`should use the fetchOptions provided`, async function () {
      const fetchOptions = {credentials: 'include'};
      const networkFirst = new NetworkFirst({fetchOptions});

      const fetchStub = sandbox
        .stub(self, 'fetch')
        .resolves(generateUniqueResponse());
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      await networkFirst.handle({
        request,
        event,
      });

      await eventDoneWaiting(event);

      expect(fetchStub.calledOnce).to.be.true;
      expect(fetchStub.calledWith(request, fetchOptions)).to.be.true;
    });

    it(`should use the CacheQueryOptions when performing a cache match`, async function () {
      const matchStub = sandbox
        .stub(self.caches.constructor.prototype, 'match')
        .resolves(generateUniqueResponse());

      sandbox.stub(self, 'fetch').callsFake(() => Promise.reject(new Error()));

      const matchOptions = {ignoreSearch: true};
      const networkFirst = new NetworkFirst({matchOptions});

      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      await networkFirst.handle({
        request,
        event,
      });

      await eventDoneWaiting(event);

      expect(matchStub.callCount).to.equal(1);
      expect(matchStub.firstCall.args[0]).to.equal(request);
      expect(matchStub.firstCall.args[1].ignoreSearch).to.equal(true);
    });
  });
});
