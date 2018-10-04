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
import {StaleWhileRevalidate} from '../../../packages/workbox-strategies/StaleWhileRevalidate.mjs';
import expectError from '../../../infra/testing/expectError';

describe(`[workbox-strategies] StaleWhileRevalidate.makeRequest()`, function() {
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

  it(`should add the initial response to the cache, when passed a URL string`, async function() {
    const url = 'http://example.io/test/';
    const request = new Request(url);
    const event = new FetchEvent('fetch', {request});
    let cachePromise;
    sandbox.stub(event, 'waitUntil').callsFake((promise) => {
      cachePromise = promise;
    });

    const staleWhileRevalidate = new StaleWhileRevalidate();
    const handleResponse = await staleWhileRevalidate.makeRequest({
      event,
      request: url,
    });

    await cachePromise;

    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    const cachedResponse = await cache.match(request);

    await compareResponses(cachedResponse, handleResponse, true);
  });

  it(`should add the initial response to the cache, when passed a Request object`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});
    let cachePromise;
    sandbox.stub(event, 'waitUntil').callsFake((promise) => {
      cachePromise = promise;
    });

    const staleWhileRevalidate = new StaleWhileRevalidate();
    const handleResponse = await staleWhileRevalidate.makeRequest({
      event,
      request,
    });

    await cachePromise;

    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    const cachedResponse = await cache.match(request);

    await compareResponses(cachedResponse, handleResponse, true);
  });
});

describe(`[workbox-strategies] StaleWhileRevalidate.handle()`, function() {
  let sandbox = sinon.createSandbox();

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

  it(`should add the initial response to the cache`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});
    let cachePromise;
    sandbox.stub(event, 'waitUntil').callsFake((promise) => {
      cachePromise = promise;
    });

    const staleWhileRevalidate = new StaleWhileRevalidate();
    const handleResponse = await staleWhileRevalidate.handle({event});

    await cachePromise;

    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    const cachedResponse = await cache.match(request);

    await compareResponses(cachedResponse, handleResponse, true);
  });

  it(`should return the cached response and not update the cache when the network request fails`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});
    let waitUntilPromise;
    let fetchThrewInWaitUntil = false;
    sandbox.stub(event, 'waitUntil').callsFake((promise) => {
      waitUntilPromise = promise.catch(() => {
        fetchThrewInWaitUntil = true;
      });
    });

    sandbox.stub(global, 'fetch').callsFake((promise) => {
      return Promise.reject(new Error(`Inject Error`));
    });

    const firstCachedResponse = new Response('response body');
    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    await cache.put(request, firstCachedResponse);

    const staleWhileRevalidate = new StaleWhileRevalidate();
    const handleResponse = await staleWhileRevalidate.handle({event});

    await waitUntilPromise;
    expect(fetchThrewInWaitUntil).to.equal(true);

    await compareResponses(firstCachedResponse, handleResponse, true);
    const secondCachedResponse = await cache.match(request);
    await compareResponses(firstCachedResponse, secondCachedResponse, true);
  });

  it(`should return the cached response and update the cache when the network request succeeds`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});
    const firstCachedResponse = new Response('response body 1');
    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    await cache.put(request, firstCachedResponse);
    let waitUntilPromise;
    sandbox.stub(event, 'waitUntil').callsFake((promise) => {
      waitUntilPromise = promise;
    });

    const staleWhileRevalidate = new StaleWhileRevalidate();

    const handleResponse = await staleWhileRevalidate.handle({event});

    await waitUntilPromise;
    await compareResponses(firstCachedResponse, handleResponse, true);

    const secondCachedResponse = await cache.match(request);
    await compareResponses(firstCachedResponse, secondCachedResponse, false);
  });

  it(`should update the cache with an the opaque cross-origin network response`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});
    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    let waitUntilPromise;
    sandbox.stub(event, 'waitUntil').callsFake((promise) => {
      waitUntilPromise = promise;
    });
    sandbox.stub(global, 'fetch').callsFake((req) => {
      return Promise.resolve(new Response('Injected Response', {status: 0}));
    });

    const staleWhileRevalidate = new StaleWhileRevalidate();
    const handleResponse = await staleWhileRevalidate.handle({event});

    await waitUntilPromise;

    expect(handleResponse.status).to.eql(0);

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

    const fetchStub = sandbox.stub(global, 'fetch').resolves(new Response());
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    await staleWhileRevalidate.handle({event});

    expect(fetchStub.calledOnce).to.be.true;
    expect(fetchStub.calledWith(request, fetchOptions)).to.be.true;
  });

  it(`should use the CacheQueryOptions when performing a cache match`, async function() {
    const matchStub = sandbox.stub(Cache.prototype, 'match').resolves(new Response());

    const matchOptions = {ignoreSearch: true};
    const staleWhileRevalidate = new StaleWhileRevalidate({matchOptions});

    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    await staleWhileRevalidate.handle({event});

    expect(matchStub.calledOnce).to.be.true;
    expect(matchStub.calledWith(request, matchOptions)).to.be.true;
  });

  it(`should throw an error when the network request fails, and there's no cache match`, async function() {
    sandbox.stub(global, 'fetch').rejects(new Error('Injected error.'));

    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    const staleWhileRevalidate = new StaleWhileRevalidate();
    await expectError(
      () => staleWhileRevalidate.handle({event}),
      'no-response'
    );
  });
});
