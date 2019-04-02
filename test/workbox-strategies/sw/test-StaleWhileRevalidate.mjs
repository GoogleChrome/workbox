/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cacheNames} from 'workbox-core/_private/cacheNames.mjs';
import {StaleWhileRevalidate} from 'workbox-strategies/StaleWhileRevalidate.mjs';
import {compareResponses} from '../../../infra/testing/helpers/compareResponses.mjs';
import {eventDoneWaiting, spyOnEvent} from '../../../infra/testing/helpers/extendable-event-utils.mjs';
import {generateOpaqueResponse} from '../../../infra/testing/helpers/generateOpaqueResponse.mjs';
import {generateUniqueResponse} from '../../../infra/testing/helpers/generateUniqueResponse.mjs';


describe(`StaleWhileRevalidate`, function() {
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
    it(`should add the initial response to the cache, when passed a URL string`, async function() {
      sandbox.stub(self, 'fetch').resolves(generateUniqueResponse());

      const url = 'http://example.io/test/';
      const request = new Request(url);
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const staleWhileRevalidate = new StaleWhileRevalidate();
      const handleResponse = await staleWhileRevalidate.makeRequest({
        event,
        request: url,
      });

      await eventDoneWaiting(event);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const cachedResponse = await cache.match(request);

      await compareResponses(cachedResponse, handleResponse, true);
    });

    it(`should add the initial response to the cache, when passed a Request object`, async function() {
      sandbox.stub(self, 'fetch').resolves(generateUniqueResponse());

      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const staleWhileRevalidate = new StaleWhileRevalidate();
      const handleResponse = await staleWhileRevalidate.makeRequest({
        event,
        request,
      });

      await eventDoneWaiting(event);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const cachedResponse = await cache.match(request);

      await compareResponses(cachedResponse, handleResponse, true);
    });
  });

  describe(`handle()`, function() {
    it(`should add the initial response to the cache`, async function() {
      sandbox.stub(self, 'fetch').resolves(generateUniqueResponse());

      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const staleWhileRevalidate = new StaleWhileRevalidate();
      const handleResponse = await staleWhileRevalidate.handle({event});

      await eventDoneWaiting(event);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const cachedResponse = await cache.match(request);

      await compareResponses(cachedResponse, handleResponse, true);
    });

    it(`should return the cached response and not update the cache when the network request fails`, async function() {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      sandbox.stub(self, 'fetch').rejects(new Error(`Inject Error`));

      const firstCachedResponse = new Response('response body');
      const cache = await caches.open(cacheNames.getRuntimeName());
      await cache.put(request, firstCachedResponse.clone());

      const staleWhileRevalidate = new StaleWhileRevalidate();
      const handleResponse = await staleWhileRevalidate.handle({event});

      let fetchThrewInWaitUntil = false;
      try {
        await eventDoneWaiting(event, {catchErrors: false});
      } catch (error) {
        fetchThrewInWaitUntil = true;
      } finally {
        expect(fetchThrewInWaitUntil).to.equal(true);
      }

      await compareResponses(firstCachedResponse, handleResponse, true);
      const secondCachedResponse = await cache.match(request);
      await compareResponses(firstCachedResponse, secondCachedResponse, true);
    });

    it(`should return the cached response and update the cache when the network request succeeds`, async function() {
      sandbox.stub(self, 'fetch').resolves(generateUniqueResponse());


      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const firstCachedResponse = new Response('response body 1');
      const cache = await caches.open(cacheNames.getRuntimeName());
      await cache.put(request, firstCachedResponse.clone());


      const staleWhileRevalidate = new StaleWhileRevalidate();
      const handleResponse = await staleWhileRevalidate.handle({event});

      await eventDoneWaiting(event);

      await compareResponses(firstCachedResponse, handleResponse, true);
      const secondCachedResponse = await cache.match(request);
      await compareResponses(firstCachedResponse, secondCachedResponse, false);
    });

    it(`should update the cache with an the opaque cross-origin network response`, async function() {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const fetchResponse = await generateOpaqueResponse();
      sandbox.stub(self, 'fetch').resolves(fetchResponse);

      const staleWhileRevalidate = new StaleWhileRevalidate();
      const handleResponse = await staleWhileRevalidate.handle({event});

      await eventDoneWaiting(event);

      expect(handleResponse.status).to.eql(0);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const cachedResponse = await cache.match(request);
      expect(cachedResponse.status).to.eql(0);
    });

    it(`should allow adding plugins to override cacheOkAndOpaque`, function() {
      const plugins = [
        {
          cacheWillUpdate: () => {},
        },
      ];
      const staleWhileRevalidate = new StaleWhileRevalidate({
        plugins,
      });
      expect(staleWhileRevalidate._plugins).to.equal(plugins);
    });

    it(`should use the fetchOptions provided`, async function() {
      const fetchOptions = {credentials: 'include'};
      const staleWhileRevalidate = new StaleWhileRevalidate({fetchOptions});

      const fetchStub = sandbox.stub(self, 'fetch').resolves(generateUniqueResponse());
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});

      await staleWhileRevalidate.handle({event});

      expect(fetchStub.calledOnce).to.be.true;
      expect(fetchStub.calledWith(request, fetchOptions)).to.be.true;
    });

    it(`should use the CacheQueryOptions when performing a cache match`, async function() {
      sandbox.stub(self, 'fetch').resolves(generateUniqueResponse());

      const matchStub = sandbox.stub(Cache.prototype, 'match').resolves(generateUniqueResponse());

      const matchOptions = {ignoreSearch: true};
      const staleWhileRevalidate = new StaleWhileRevalidate({matchOptions});

      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});

      await staleWhileRevalidate.handle({event});

      expect(matchStub.calledOnce).to.be.true;
      expect(matchStub.calledWith(request, matchOptions)).to.be.true;
    });

    it(`should throw an error when the network request fails, and there's no cache match`, async function() {
      sandbox.stub(self, 'fetch').rejects(new Error('Injected error.'));

      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});

      const staleWhileRevalidate = new StaleWhileRevalidate();
      await expectError(
          () => staleWhileRevalidate.handle({event}),
          'no-response'
      );
    });
  });
});
