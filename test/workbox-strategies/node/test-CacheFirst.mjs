/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/
import sinon from 'sinon';
import {expect} from 'chai';

import {_private} from '../../../packages/workbox-core/index.mjs';
import {compareResponses} from '../utils/response-comparisons.mjs';

import {CacheFirst} from '../../../packages/workbox-strategies/CacheFirst.mjs';

describe(`[workbox-strategies] CacheFirst.makeRequest()`, function() {
  const sandbox = sinon.sandbox.create();

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

  it(`should be able to make a request when passed a URL string`, async function() {
    const url = 'http://example.io/test/';
    const request = new Request(url);
    const event = new FetchEvent('fetch', {request});

    const fetchResponse = new Response('Hello Test.');
    sandbox.stub(global, 'fetch').callsFake((req) => {
      expect(req.url).to.equal(request.url);
      return Promise.resolve(fetchResponse);
    });

    let cachePromise;
    sandbox.stub(event, 'waitUntil').callsFake((promise) => {
      cachePromise = promise;
    });

    const cacheFirst = new CacheFirst();
    const firstResponse = await cacheFirst.makeRequest({
      event,
      request: url,
    });

    // Wait until cache.put is finished.
    await cachePromise;
    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    const firstCachedResponse = await cache.match(request);

    await compareResponses(firstCachedResponse, fetchResponse, true);
    await compareResponses(firstResponse, fetchResponse, true);

    // Reset spy state so we can check fetch wasn't called.
    global.fetch.reset();

    const secondResponse = await cacheFirst.makeRequest({
      request: url,
    });

    const secondCachedResponse = await cache.match(request);
    await compareResponses(firstCachedResponse, secondResponse, true);
    await compareResponses(firstCachedResponse, secondCachedResponse, true);
    expect(fetch.callCount).to.equal(0);
  });

  it(`should be able to make a request when passed a Request object`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    const fetchResponse = new Response('Hello Test.');
    sandbox.stub(global, 'fetch').callsFake((req) => {
      expect(req).to.equal(request);
      return Promise.resolve(fetchResponse);
    });

    let cachePromise;
    sandbox.stub(event, 'waitUntil').callsFake((promise) => {
      cachePromise = promise;
    });

    const cacheFirst = new CacheFirst();
    const firstResponse = await cacheFirst.makeRequest({
      event,
      request,
    });

    // Wait until cache.put is finished.
    await cachePromise;
    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    const firstCachedResponse = await cache.match(request);

    await compareResponses(firstCachedResponse, fetchResponse, true);
    await compareResponses(firstResponse, fetchResponse, true);

    // Reset spy state so we can check fetch wasn't called.
    global.fetch.reset();

    const secondResponse = await cacheFirst.makeRequest({
      request,
    });

    const secondCachedResponse = await cache.match(request);
    await compareResponses(firstCachedResponse, secondResponse, true);
    await compareResponses(firstCachedResponse, secondCachedResponse, true);
    expect(fetch.callCount).to.equal(0);
  });
});


describe(`[workbox-strategies] CacheFirst.handle()`, function() {
  let sandbox = sinon.sandbox.create();

  beforeEach(async function() {
    let usedCacheNames = await caches.keys();
    await Promise.all(usedCacheNames.map((cacheName) => {
      return caches.delete(cacheName);
    }));

    sandbox.restore();
  });

  after(async function() {
    let usedCacheNames = await caches.keys();
    await Promise.all(usedCacheNames.map((cacheName) => {
      return caches.delete(cacheName);
    }));

    sandbox.restore();
  });

  it(`should be able to fetch and cache a request to default cache`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    const fetchResponse = new Response('Hello Test.');
    sandbox.stub(global, 'fetch').callsFake((req) => {
      expect(req).to.equal(request);
      return Promise.resolve(fetchResponse);
    });
    let cachePromise;
    sandbox.stub(event, 'waitUntil').callsFake((promise) => {
      cachePromise = promise;
    });

    const cacheFirst = new CacheFirst();
    const firstHandleResponse = await cacheFirst.handle({event});

    // Wait until cache.put is finished.
    await cachePromise;
    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    const firstCachedResponse = await cache.match(request);

    await compareResponses(firstCachedResponse, fetchResponse, true);
    await compareResponses(firstHandleResponse, fetchResponse, true);

    const secondHandleResponse = await cacheFirst.handle({event});

    // Reset spy state so we can check fetch wasn't called.
    global.fetch.reset();

    const secondCachedResponse = await cache.match(request);
    await compareResponses(firstCachedResponse, secondHandleResponse, true);
    await compareResponses(firstCachedResponse, secondCachedResponse, true);
    expect(fetch.callCount).to.equal(0);
  });

  it(`should be able to cache a non-existent request to custom cache`, async function() {
    const cacheName = 'test-cache-name';
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    sandbox.stub(global, 'fetch').callsFake((req) => {
      expect(req).to.equal(request);
      return Promise.resolve(new Response('Hello Test.'));
    });
    let cachePromise;
    sandbox.stub(event, 'waitUntil').callsFake((promise) => {
      cachePromise = promise;
    });

    const cacheFirst = new CacheFirst({
      cacheName,
    });
    const firstHandleResponse = await cacheFirst.handle({event});

    // Wait until cache.put is finished.
    await cachePromise;
    const cache = await caches.open(cacheName);
    const firstCachedResponse = await cache.match(request);

    await compareResponses(firstHandleResponse, firstCachedResponse, true);
  });

  it(`should not cache an opaque response by default`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    sandbox.stub(global, 'fetch').callsFake((req) => {
      expect(req).to.equal(request);
      return Promise.resolve(new Response('Hello Test.', {
        status: 0,
      }));
    });
    let cachePromise;
    sandbox.stub(event, 'waitUntil').callsFake((promise) => {
      cachePromise = promise;
    });

    const cacheFirst = new CacheFirst();
    const firstHandleResponse = await cacheFirst.handle({event});

    // Wait until cache.put is finished.
    await cachePromise;
    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    const firstCachedResponse = await cache.match(request);

    expect(firstCachedResponse).to.equal(null);
    expect(firstHandleResponse).to.exist;
  });

  it(`should cache an opaque response when a cacheWillUpdate plugin returns true`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    sandbox.stub(global, 'fetch').callsFake((req) => {
      expect(req).to.equal(request);
      return Promise.resolve(new Response('Hello Test.', {
        status: 0,
      }));
    });
    let cachePromise;
    sandbox.stub(event, 'waitUntil').callsFake((promise) => {
      cachePromise = promise;
    });

    const cacheFirst = new CacheFirst({
      plugins: [
        {
          cacheWillUpdate: ({request, response}) => {
            return response;
          },
        },
      ],
    });
    const firstHandleResponse = await cacheFirst.handle({event});

    // Wait until cache.put is finished.
    await cachePromise;
    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    const firstCachedResponse = await cache.match(request);

    await compareResponses(firstHandleResponse, firstCachedResponse, true);
  });

  it(`should return the plugin cache response`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    const injectedResponse = new Response('response body');
    const cache = await caches.open(_private.cacheNames.getRuntimeName());
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
    const firstHandleResponse = await cacheFirst.handle({event});

    await compareResponses(firstHandleResponse, pluginResponse, true);
  });

  it(`should fallback to fetch if the plugin.cacheResponseWillBeUsed returns null`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    const fetchResponse = new Response('Hello Test.');
    sandbox.stub(global, 'fetch').callsFake((req) => {
      expect(req).to.equal(request);
      return Promise.resolve(fetchResponse);
    });
    let cachePromise;
    sandbox.stub(event, 'waitUntil').callsFake((promise) => {
      cachePromise = promise;
    });

    const injectedResponse = new Response('response body');
    const cache = await caches.open(_private.cacheNames.getRuntimeName());
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
    const firstHandleResponse = await cacheFirst.handle({event});

    // Wait until cache.put is finished.
    await cachePromise;

    // The cache should be overridden.
    const firstCachedResponse = await cache.match(request);

    await compareResponses(firstCachedResponse, fetchResponse, true);
    await compareResponses(firstHandleResponse, fetchResponse, true);
  });

  it(`should be able to handle a network error`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});
    const injectedError = new Error(`Injected Error.`);
    sandbox.stub(global, 'fetch').callsFake((req) => {
      return Promise.reject(injectedError);
    });

    const cacheFirst = new CacheFirst();
    try {
      await cacheFirst.handle({event});
      throw new Error('Expected an error to be thrown.');
    } catch (err) {
      expect(err).to.equal(injectedError);
    }
  });

  it(`should use the fetchOptions provided`, async function() {
    const fetchOptions = {credentials: 'include'};
    const cacheFirst = new CacheFirst({fetchOptions});

    const fetchStub = sandbox.stub(global, 'fetch').resolves(new Response());
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    await cacheFirst.handle({event});

    expect(fetchStub.calledOnce).to.be.true;
    expect(fetchStub.calledWith(request, fetchOptions)).to.be.true;
  });
});
