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

import expectError from '../../../infra/testing/expectError';
import {devOnly} from '../../../infra/testing/env-it';
import {_private} from '../../../packages/workbox-core/index.mjs';
import {compareResponses} from '../utils/response-comparisons.mjs';

import {NetworkFirst} from '../../../packages/workbox-strategies/NetworkFirst.mjs';

describe(`[workbox-strategies] NetworkFirst`, function() {
  let sandbox = sinon.sandbox.create();

  beforeEach(async function() {
    let usedCacheNames = await caches.keys();
    await Promise.all(usedCacheNames.map((cacheName) => {
      return caches.delete(cacheName);
    }));

    sandbox.restore();
  });

  afterEach(async function() {
    let usedCacheNames = await caches.keys();
    await Promise.all(usedCacheNames.map((cacheName) => {
      return caches.delete(cacheName);
    }));

    sandbox.restore();
  });

  it(`should add the network response to the cache`, async function() {
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

    const networkFirst = new NetworkFirst();
    const handleResponse = await networkFirst.handle({event});

    // Wait until cache.put is finished.
    await cachePromise;

    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    const cachedResponse = await cache.match(request);

    await compareResponses(cachedResponse, handleResponse, true);
  });

  it(`should return the cached response if exists and not update the cache when the network request fails`, async function() {
    sandbox.stub(global, 'fetch').callsFake((req) => {
      return Promise.reject(new Error('Injected error.'));
    });

    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    const networkFirst = new NetworkFirst();
    const emptyCacheResponse = await networkFirst.handle({event});
    expect(emptyCacheResponse).to.not.exist;

    const injectedResponse = new Response('response body');
    const cache = await caches.open(_private.cacheNames.getRuntimeName());
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

    const TEST_TIMEOUT_SECS = 5;

    sandbox.stub(global, 'fetch').callsFake((req) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(new Response('Timedout Response')), (TEST_TIMEOUT_SECS * 2 * 1000));
      });
    });

    const networkFirst = new NetworkFirst({
      networkTimeoutSeconds: TEST_TIMEOUT_SECS,
    });

    let handlePromise = networkFirst.handle({event});
    clock.tick(TEST_TIMEOUT_SECS * 1.5 * 1000);
    const emptyCacheResponse = await handlePromise;
    expect(emptyCacheResponse).to.not.exist;

    const injectedResponse = new Response('response body');
    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    await cache.put(request, injectedResponse.clone());

    handlePromise = networkFirst.handle({event});
    clock.tick(TEST_TIMEOUT_SECS * 1.5 * 1000);
    const populatedCacheResponse = await handlePromise;
    await compareResponses(populatedCacheResponse, injectedResponse, true);
  });

  devOnly.it(`should throw when NetworkFirst() is called with an invalid networkTimeoutSeconds parameter`, function() {
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

    const networkFirst = new NetworkFirst();

    const handleResponse = await networkFirst.handle({event});
    // wait for cache.put
    await cachePromise;
    await compareResponses(injectedResponse, handleResponse, false);

    const currentCachedResponse = await cache.match(request);
    await compareResponses(handleResponse, currentCachedResponse, true);
  });

  it(`should update the cache with an the opaque cross-origin network response`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    const fetchResponse = new Response('Hello Test.', {
      status: 0,
    });
    sandbox.stub(global, 'fetch').callsFake((req) => {
      expect(req).to.equal(request);
      return Promise.resolve(fetchResponse);
    });

    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    let cachePromise;
    sandbox.stub(event, 'waitUntil').callsFake((promise) => {
      cachePromise = promise;
    });

    const networkFirst = new NetworkFirst();
    const handleResponse = await networkFirst.handle({event});
    expect(handleResponse.status).to.eql(0);

    await cachePromise;

    const cachedResponse = await cache.match(request);
    expect(cachedResponse.status).to.eql(0);
  });

  it(`should not cache an opaque response if they add a custom plugin`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    const fetchResponse = new Response('Hello Test.', {
      status: 0,
    });
    sandbox.stub(global, 'fetch').callsFake((req) => {
      expect(req).to.equal(request);
      return Promise.resolve(fetchResponse);
    });

    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    let cachePromise;
    sandbox.stub(event, 'waitUntil').callsFake((promise) => {
      cachePromise = promise;
    });

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
    expect(handleResponse.status).to.eql(0);

    await cachePromise;

    const cachedResponse = await cache.match(request);
    expect(cachedResponse).to.not.exist;
  });
});
