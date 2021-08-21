/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cacheNames} from 'workbox-core/_private/cacheNames.mjs';
import {CacheOnly} from 'workbox-strategies/CacheOnly.mjs';
import {compareResponses} from '../../../infra/testing/helpers/compareResponses.mjs';
import {spyOnEvent} from '../../../infra/testing/helpers/extendable-event-utils.mjs';
import {generateUniqueResponse} from '../../../infra/testing/helpers/generateUniqueResponse.mjs';

describe(`CacheOnly`, function () {
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
    it(`should not return a response when the cache isn't populated`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const cacheOnly = new CacheOnly();
      await expectError(
        () =>
          cacheOnly.handle({
            request,
            event,
          }),
        'no-response',
      );
    });

    it(`should return the cached response when the cache is populated`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const injectedResponse = generateUniqueResponse();
      const cache = await caches.open(cacheNames.getRuntimeName());
      await cache.put(request, injectedResponse.clone());

      const cacheOnly = new CacheOnly();
      const handleResponse = await cacheOnly.handle({
        request,
        event,
      });
      await compareResponses(injectedResponse, handleResponse, true);
    });

    it(`should support using a string as the request`, async function () {
      const stringRequest = 'http://example.io/test/';
      const request = new Request(stringRequest);
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const injectedResponse = generateUniqueResponse();
      const cache = await caches.open(cacheNames.getRuntimeName());
      await cache.put(request, injectedResponse.clone());

      const cacheOnly = new CacheOnly();
      const handleResponse = await cacheOnly.handle({
        request: stringRequest,
        event,
      });
      await compareResponses(injectedResponse, handleResponse, true);
    });

    it(`should return no cached response from custom cache name`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const injectedResponse = generateUniqueResponse();
      const cache = await caches.open(cacheNames.getRuntimeName());
      await cache.put(request, injectedResponse.clone());

      const cacheOnly = new CacheOnly({cacheName: 'test-cache-name'});
      await expectError(
        () =>
          cacheOnly.handle({
            request,
            event,
          }),
        'no-response',
      );
    });

    it(`should return cached response from custom cache name`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const injectedResponse = generateUniqueResponse();
      const cache = await caches.open(
        cacheNames.getRuntimeName('test-cache-name'),
      );
      await cache.put(request, injectedResponse.clone());

      const cacheOnly = new CacheOnly({cacheName: 'test-cache-name'});
      const handleResponse = await cacheOnly.handle({
        request,
        event,
      });
      await compareResponses(injectedResponse, handleResponse, true);
    });

    it(`should return the cached response from plugin.cachedResponseWillBeUsed`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const injectedResponse = generateUniqueResponse();
      const cache = await caches.open(cacheNames.getRuntimeName());
      await cache.put(request, injectedResponse.clone());

      const pluginResponse = generateUniqueResponse();
      const cacheOnly = new CacheOnly({
        plugins: [
          {
            cachedResponseWillBeUsed: () => {
              return pluginResponse;
            },
          },
        ],
      });
      const handleResponse = await cacheOnly.handle({
        request,
        event,
      });
      await compareResponses(pluginResponse, handleResponse, true);
    });

    it(`should use the CacheQueryOptions when performing a cache match`, async function () {
      const matchStub = sandbox
        .stub(self.caches.constructor.prototype, 'match')
        .resolves(generateUniqueResponse());

      const matchOptions = {ignoreSearch: true};
      const cacheOnly = new CacheOnly({matchOptions});

      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      await cacheOnly.handle({
        request,
        event,
      });

      expect(matchStub.calledOnce).to.be.true;
      expect(matchStub.firstCall.args[0]).to.equal(request);
      expect(matchStub.firstCall.args[1].ignoreSearch).to.equal(true);
    });
  });
});
