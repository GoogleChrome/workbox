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

/* eslint-env mocha, browser */

import RequestWrapper from '../../src/lib/request-wrapper.js';
import CacheFirst from '../../src/lib/cache-first.js';

importScripts('/packages/workbox-runtime-caching/test/utils/setup.js');

describe(`Test of the CacheFirst handler`, function() {
  const CACHE_NAME = location.href;
  const COUNTER_URL = new URL('/__echo/counter', location).href;
  const CROSS_ORIGIN_COUNTER_URL = generateCrossOriginUrl(COUNTER_URL);

  beforeEach(async function() {
    await caches.delete(CACHE_NAME);
  });

  it(`should add the initial response to the cache, and then reuse it without updating the cache`, async function() {
    const requestWrapper = new RequestWrapper({cacheName: CACHE_NAME});
    const cacheFirst = new CacheFirst({requestWrapper, waitOnCache: true});

    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    const firstHandleResponse = await cacheFirst.handle({event});

    const cache = await caches.open(CACHE_NAME);
    const firstCachedResponse = await cache.match(COUNTER_URL);

    await expectSameResponseBodies(firstHandleResponse, firstCachedResponse);

    const secondHandleResponse = await cacheFirst.handle({event});
    const secondCachedResponse = await cache.match(COUNTER_URL);

    await expectSameResponseBodies(firstCachedResponse, secondHandleResponse);
    await expectSameResponseBodies(firstCachedResponse, secondCachedResponse);
  });

  it(`should not update the cache with an the opaque cross-origin network response by default`, async function() {
    const requestWrapper = new RequestWrapper({cacheName: CACHE_NAME});
    const cacheFirst = new CacheFirst({requestWrapper, waitOnCache: false});

    const event = new FetchEvent('fetch', {
      request: new Request(CROSS_ORIGIN_COUNTER_URL, {mode: 'no-cors'})});
    const handleResponse = await cacheFirst.handle({event});

    expect(handleResponse.type).to.eql('opaque');

    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(CROSS_ORIGIN_COUNTER_URL);

    expect(cachedResponse).to.be.undefined;
  });

  it(`should update the cache with an the opaque cross-origin network response when a cacheWillUpdate plugin returns true`, async function() {
    const cacheWillUpdate = {cacheWillUpdate: () => true};
    const requestWrapper = new RequestWrapper({
      cacheName: CACHE_NAME,
      plugins: [cacheWillUpdate],
    });
    const cacheFirst = new CacheFirst({requestWrapper, waitOnCache: true});

    const event = new FetchEvent('fetch', {
      request: new Request(CROSS_ORIGIN_COUNTER_URL, {mode: 'no-cors'})});
    const handleResponse = await cacheFirst.handle({event});

    expect(handleResponse.type).to.eql('opaque');

    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(CROSS_ORIGIN_COUNTER_URL);

    expect(cachedResponse.type).to.eql('opaque');
  });
});
