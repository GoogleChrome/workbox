/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cacheNames} from 'workbox-core/_private/cacheNames.mjs';
import {CacheFirst} from 'workbox-strategies/CacheFirst.mjs';
import {compareResponses} from '../../../infra/testing/helpers/compareResponses.mjs';
import {
  eventDoneWaiting,
  spyOnEvent,
} from '../../../infra/testing/helpers/extendable-event-utils.mjs';
import {generateOpaqueResponse} from '../../../infra/testing/helpers/generateOpaqueResponse.mjs';
import {generateUniqueResponse} from '../../../infra/testing/helpers/generateUniqueResponse.mjs';

describe(`CacheFirst`, function () {
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
    it(`should be able to fetch and cache a request to default cache`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const fetchResponse = generateUniqueResponse();
      sandbox.stub(self, 'fetch').resolves(fetchResponse);

      const cacheFirst = new CacheFirst();
      const firstHandleResponse = await cacheFirst.handle({
        request,
        event,
      });

      // Wait until cache.put is finished.
      await eventDoneWaiting(event);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const firstCachedResponse = await cache.match(request);

      await compareResponses(firstCachedResponse, fetchResponse, true);
      await compareResponses(firstHandleResponse, fetchResponse, true);

      const secondHandleResponse = await cacheFirst.handle({
        request,
        event,
      });

      // Reset spy state so we can check fetch wasn't called.
      self.fetch.resetHistory();

      const secondCachedResponse = await cache.match(request);
      await compareResponses(firstCachedResponse, secondHandleResponse, true);
      await compareResponses(firstCachedResponse, secondCachedResponse, true);
      expect(fetch.callCount).to.equal(0);
    });

    it(`should support using a string as the request`, async function () {
      const stringRequest = 'http://example.io/test/';
      const request = new Request(stringRequest);
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const fetchResponse = generateUniqueResponse();
      sandbox.stub(self, 'fetch').resolves(fetchResponse);

      const cacheFirst = new CacheFirst();
      const firstHandleResponse = await cacheFirst.handle({
        request: stringRequest,
        event,
      });

      // Wait until cache.put is finished.
      await eventDoneWaiting(event);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const firstCachedResponse = await cache.match(request);

      await compareResponses(firstCachedResponse, fetchResponse, true);
      await compareResponses(firstHandleResponse, fetchResponse, true);

      const secondHandleResponse = await cacheFirst.handle({
        request,
        event,
      });

      // Reset spy state so we can check fetch wasn't called.
      self.fetch.resetHistory();

      const secondCachedResponse = await cache.match(request);
      await compareResponses(firstCachedResponse, secondHandleResponse, true);
      await compareResponses(firstCachedResponse, secondCachedResponse, true);
      expect(fetch.callCount).to.equal(0);
    });

    it(`should be able to cache a non-existent request to custom cache`, async function () {
      const cacheName = 'test-cache-name';
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const fetchResponse = generateUniqueResponse();
      sandbox.stub(self, 'fetch').resolves(fetchResponse);

      const cacheFirst = new CacheFirst({
        cacheName,
      });
      const firstHandleResponse = await cacheFirst.handle({
        request,
        event,
      });

      // Wait until cache.put is finished.
      await eventDoneWaiting(event);

      const cache = await caches.open(cacheName);
      const firstCachedResponse = await cache.match(request);

      await compareResponses(firstHandleResponse, firstCachedResponse, true);
    });

    it(`should not cache an opaque response by default`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const fetchResponse = await generateOpaqueResponse();
      sandbox.stub(self, 'fetch').resolves(fetchResponse);

      const cacheFirst = new CacheFirst();
      const firstHandleResponse = await cacheFirst.handle({
        request,
        event,
      });

      // Wait until cache.put is finished.
      await eventDoneWaiting(event);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const firstCachedResponse = await cache.match(request);

      expect(firstCachedResponse).to.equal(undefined);
      expect(firstHandleResponse).to.exist;
    });

    it(`should cache an opaque response when a cacheWillUpdate plugin returns true`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const fetchResponse = await generateOpaqueResponse();
      sandbox.stub(self, 'fetch').resolves(fetchResponse);

      const cacheFirst = new CacheFirst({
        plugins: [
          {
            cacheWillUpdate: ({request, response}) => {
              return response;
            },
          },
        ],
      });
      const firstHandleResponse = await cacheFirst.handle({
        request,
        event,
      });

      // Wait until cache.put is finished.
      await eventDoneWaiting(event);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const firstCachedResponse = await cache.match(request);

      await compareResponses(firstHandleResponse, firstCachedResponse, true);
    });

    it(`should return the plugin cache response`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const injectedResponse = new Response('response body');
      const cache = await caches.open(cacheNames.getRuntimeName());
      await cache.put(request, injectedResponse.clone());

      const pluginResponse = new Response('plugin response');
      const cacheFirst = new CacheFirst({
        plugins: [
          {
            cachedResponseWillBeUsed: () => {
              return pluginResponse;
            },
          },
        ],
      });
      const firstHandleResponse = await cacheFirst.handle({
        request,
        event,
      });

      // Wait until cache.put is finished.
      await eventDoneWaiting(event);

      await compareResponses(firstHandleResponse, pluginResponse, true);
    });

    it(`should fallback to fetch if the plugin.cacheResponseWillBeUsed returns null`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const fetchResponse = generateUniqueResponse();
      sandbox.stub(self, 'fetch').resolves(fetchResponse);

      const injectedResponse = generateUniqueResponse();
      const cache = await caches.open(cacheNames.getRuntimeName());
      await cache.put(request, injectedResponse.clone());

      const cacheFirst = new CacheFirst({
        plugins: [
          {
            cachedResponseWillBeUsed: () => {
              return null;
            },
          },
        ],
      });

      const firstHandleResponse = await cacheFirst.handle({
        request,
        event,
      });

      // Wait until cache.put is finished.
      await eventDoneWaiting(event);

      // The cache should be overridden.
      const firstCachedResponse = await cache.match(request);

      await compareResponses(firstCachedResponse, fetchResponse, true);
      await compareResponses(firstHandleResponse, fetchResponse, true);
    });

    it(`should be able to handle a network error`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const injectedError = new Error(`Injected Error.`);
      sandbox.stub(self, 'fetch').rejects(injectedError);

      const cacheFirst = new CacheFirst();
      await expectError(
        () =>
          cacheFirst.handle({
            request,
            event,
          }),
        'no-response',
      );

      // Wait until cache.put is finished.
      await eventDoneWaiting(event);
    });

    it(`should use the fetchOptions provided`, async function () {
      const fetchOptions = {credentials: 'include'};
      const cacheFirst = new CacheFirst({fetchOptions});

      const fetchStub = sandbox
        .stub(self, 'fetch')
        .resolves(generateUniqueResponse());
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      await cacheFirst.handle({
        request,
        event,
      });

      // Wait until cache.put is finished.
      await eventDoneWaiting(event);

      expect(fetchStub.calledOnce).to.be.true;
      expect(fetchStub.calledWith(request, fetchOptions)).to.be.true;
    });

    it(`should use the CacheQueryOptions when performing a cache match`, async function () {
      const matchStub = sandbox
        .stub(self.caches.constructor.prototype, 'match')
        .resolves(generateUniqueResponse());

      const matchOptions = {ignoreSearch: true};
      const cacheFirst = new CacheFirst({matchOptions});

      sandbox.stub(self, 'fetch').resolves(generateUniqueResponse());
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      await cacheFirst.handle({
        request,
        event,
      });

      // Wait until cache.put is finished.
      await eventDoneWaiting(event);

      expect(matchStub.calledOnce).to.be.true;
      expect(matchStub.firstCall.args[0]).to.equal(request);
      expect(matchStub.firstCall.args[1].ignoreSearch).to.equal(true);
    });
  });
});
