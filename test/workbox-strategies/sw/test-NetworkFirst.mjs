/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cacheNames} from 'workbox-core/_private/cacheNames.mjs';
import {NetworkFirst} from 'workbox-strategies/NetworkFirst.mjs';
import {compareResponses} from '../../../infra/testing/helpers/compareResponses.mjs';
import {eventDoneWaiting, spyOnEvent} from '../../../infra/testing/helpers/extendable-event-utils.mjs';
import {generateOpaqueResponse} from '../../../infra/testing/helpers/generateOpaqueResponse.mjs';
import {generateUniqueResponse} from '../../../infra/testing/helpers/generateUniqueResponse.mjs';
import {sleep} from '../../../infra/testing/helpers/sleep.mjs';


describe(`NetworkFirst`, function() {
  const sandbox = sinon.createSandbox();

  beforeEach(async function() {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    sandbox.restore();
  });

  after(async function() {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    sandbox.restore();
  });

  describe(`makeRequest()`, function() {
    it(`should add the network response to the cache, when passed a URL string`, async function() {
      const url = 'http://example.io/test/';
      const request = new Request(url);
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const fetchResponse = generateOpaqueResponse();
      sandbox.stub(self, 'fetch').resolves(fetchResponse);

      const networkFirst = new NetworkFirst();
      const handleResponse = await networkFirst.makeRequest({
        event,
        request: url,
      });

      // Wait until cache.put is finished.
      await eventDoneWaiting(event);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const cachedResponse = await cache.match(request);

      await compareResponses(cachedResponse, handleResponse, true);
    });

    it(`should add the network response to the cache, when passed a Request object`, async function() {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const fetchResponse = generateOpaqueResponse();
      sandbox.stub(self, 'fetch').resolves(fetchResponse);

      const networkFirst = new NetworkFirst();
      const handleResponse = await networkFirst.makeRequest({
        event,
        request,
      });

      // Wait until cache.put is finished.
      await eventDoneWaiting(event);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const cachedResponse = await cache.match(request);

      await compareResponses(cachedResponse, handleResponse, true);
    });
  });

  describe(`handle()`, function() {
    it(`should add the network response to the cache`, async function() {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const fetchResponse = generateOpaqueResponse();
      sandbox.stub(self, 'fetch').resolves(fetchResponse);

      const networkFirst = new NetworkFirst();
      const handleResponse = await networkFirst.handle({event});

      // Wait until cache.put is finished.
      await eventDoneWaiting(event);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const cachedResponse = await cache.match(request);

      await compareResponses(cachedResponse, handleResponse, true);
    });

    it(`should return the cached response if exists and not update the cache when the network request fails`, async function() {
      sandbox.stub(self, 'fetch').rejects(new Error('Injected error.'));

      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});

      const networkFirst = new NetworkFirst();
      await expectError(
          () => networkFirst.handle({event}),
          'no-response'
      );

      const injectedResponse = new Response('response body');
      const cache = await caches.open(cacheNames.getRuntimeName());
      await cache.put(request, injectedResponse.clone());

      const cachedResponse = await networkFirst.handle({event});
      await compareResponses(cachedResponse, injectedResponse, true);

      const secondCachedResponse = await networkFirst.handle({event});
      await compareResponses(cachedResponse, secondCachedResponse, true);
    });

    it(`should return the cached response if the network request times out`, async function() {
      const clock = sandbox.useFakeTimers();
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});

      const networkTimeoutSeconds = 5;
      const sleepLongerThanNetworkTimeout =
          sleep(3 * networkTimeoutSeconds * 1000);

      sandbox.stub(self, 'fetch').callsFake(async (req) => {
        await sleepLongerThanNetworkTimeout;
        return new Response('Timedout Response');
      });

      const networkFirst = new NetworkFirst({networkTimeoutSeconds});

      const injectedResponse = new Response('response body');
      const cache = await caches.open(cacheNames.getRuntimeName());
      await cache.put(request, injectedResponse.clone());

      const handlePromise = networkFirst.handle({event});

      // Tick for a shorter time than the network timeout to ensure the
      // cached version is used.
      clock.tick(2 * networkTimeoutSeconds * 1000);

      const populatedCacheResponse = await handlePromise;
      await compareResponses(populatedCacheResponse, injectedResponse, true);
    });

    it(`should return the network response if the timeout is exceeded, but there is no cached response`, async function() {
      const clock = sandbox.useFakeTimers();

      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});

      // To ensure an attempt to respond from cache is made.
      sandbox.spy(NetworkFirst.prototype, '_respondFromCache');

      const networkTimeoutSeconds = 5;
      const sleepLongerThanNetworkTimeout =
          sleep(2 * networkTimeoutSeconds * 1000);

      const networkResponse = new Response('from network');

      sandbox.stub(self, 'fetch').callsFake(async () => {
        await sleepLongerThanNetworkTimeout;
        return networkResponse;
      });

      const networkFirst = new NetworkFirst({networkTimeoutSeconds});
      let handlePromise = networkFirst.handle({event});

      // Tick for a longer time than the network timeout to ensure the
      // network request can finish.
      clock.tick(3 * networkTimeoutSeconds * 1000);

      const handlerResponse = await handlePromise;

      expect(handlerResponse).to.equal(networkResponse);
      expect(NetworkFirst.prototype._respondFromCache.callCount).to.equal(1);
      expect(NetworkFirst.prototype._respondFromCache.args[0][0].event)
          .to.equal(event);
    });

    it(`should throw when NetworkFirst() is called with an invalid networkTimeoutSeconds parameter`, function() {
      if (process.env.NODE_ENV === 'production') this.skip();

      return expectError(() => new NetworkFirst({networkTimeoutSeconds: 'invalid'}), 'incorrect-type', (err) => {
        expect(err.details.paramName).to.deep.equal('networkTimeoutSeconds');
        expect(err.details.expectedType).to.deep.equal('number');
        expect(err.details.moduleName).to.deep.equal('workbox-strategies');
        expect(err.details.className).to.deep.equal('NetworkFirst');
        expect(err.details.funcName).to.deep.equal('constructor');
      });
    });

    it(`should return the network response and update the cache when the network request succeeds`, async function() {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const fetchResponse = generateOpaqueResponse();
      sandbox.stub(self, 'fetch').resolves(fetchResponse);

      const injectedResponse = generateUniqueResponse();
      const cache = await caches.open(cacheNames.getRuntimeName());
      await cache.put(request, injectedResponse.clone());

      const networkFirst = new NetworkFirst();

      const handleResponse = await networkFirst.handle({event});

      // wait for cache.put
      await eventDoneWaiting(event);

      await compareResponses(injectedResponse, handleResponse, false);

      const currentCachedResponse = await cache.match(request);
      await compareResponses(handleResponse, currentCachedResponse, true);
    });

    it(`should update the cache with an the opaque cross-origin network response`, async function() {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const fetchResponse = await generateOpaqueResponse();
      sandbox.stub(self, 'fetch').resolves(fetchResponse);

      const networkFirst = new NetworkFirst();
      const handleResponse = await networkFirst.handle({event});
      expect(handleResponse.status).to.equal(0);

      await eventDoneWaiting(event);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const cachedResponse = await cache.match(request);

      expect(cachedResponse.status).to.equal(0);
    });

    it(`should not cache an opaque response if they add a custom plugin`, async function() {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const fetchResponse = await generateOpaqueResponse();
      sandbox.stub(self, 'fetch').resolves(fetchResponse);

      const networkFirst = new NetworkFirst({
        plugins: [
          {
            cacheWillUpdate: () => {
              return null;
            },
          },
        ],
      });

      const handleResponse = await networkFirst.handle({event});
      expect(handleResponse.status).to.equal(0);

      await eventDoneWaiting(event);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const cachedResponse = await cache.match(request);
      expect(cachedResponse).to.not.exist;
    });

    it(`should use the fetchOptions provided`, async function() {
      const fetchOptions = {credentials: 'include'};
      const networkFirst = new NetworkFirst({fetchOptions});

      const fetchStub = sandbox.stub(self, 'fetch').resolves(generateUniqueResponse());
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});

      await networkFirst.handle({event});

      expect(fetchStub.calledOnce).to.be.true;
      expect(fetchStub.calledWith(request, fetchOptions)).to.be.true;
    });

    it(`should use the CacheQueryOptions when performing a cache match`, async function() {
      const matchStub = sandbox.stub(Cache.prototype, 'match').resolves(generateUniqueResponse());
      sandbox.stub(self, 'fetch').callsFake(() => Promise.reject());

      const matchOptions = {ignoreSearch: true};
      const networkFirst = new NetworkFirst({matchOptions});

      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});

      await networkFirst.handle({event});

      expect(matchStub.calledWith(request, matchOptions)).to.be.true;
    });

    it(`should not allow waitUntil if responded`, async function() {
      const fakeTimer = sandbox.useFakeTimers({
        toFake: ['Date'],
      });

      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});

      const cache = await caches.open(cacheNames.getRuntimeName());
      await cache.put('http://example.io/test/', new Response('from cache'));

      let fetchResolve;
      sandbox.stub(self, 'fetch').callsFake(() => {
        return new Promise((resolve) => {
          fetchResolve = resolve;
        });
      });


      let throwOnWaitUntil = false;
      sandbox.stub(event, 'waitUntil').callsFake((newPromise) => {
        if (throwOnWaitUntil) {
          throw new Error('This should not be called after respondWith.');
        }
      });

      // Edge case
      // Timer and network request started
      // Make the timeout occur
      // Then make the fetch return
      // Then make the fetch event get cached

      const networkFirst = new NetworkFirst({
        networkTimeoutSeconds: 1,
      });

      let networkPromise = null;
      const origMethod = networkFirst._getNetworkPromise.bind(networkFirst);
      sandbox.stub(networkFirst, '_getNetworkPromise').callsFake((...args) => {
        networkPromise = origMethod(...args);
        return networkPromise;
      });

      const handlePromise = networkFirst.handle({event});

      // Let timer run
      fakeTimer.tick(1001);

      const reseponse = await handlePromise;
      throwOnWaitUntil = true;
      const resultText = await reseponse.text();
      expect(resultText).to.equal('from cache');

      fetchResolve(new Response('Network Response'));

      // Wait for network promise to finish
      await networkPromise;
    });
  });
});
