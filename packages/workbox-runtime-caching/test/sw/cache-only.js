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
import CacheOnly from '../../src/lib/cache-only.js';

importScripts('/packages/workbox-runtime-caching/test/utils/setup.js');

describe(`Test of the CacheOnly handler`, function() {
  const CACHE_NAME = location.href;
  const COUNTER_URL = new URL('/__echo/counter', location).href;

  beforeEach(async function() {
    await caches.delete(CACHE_NAME);
  });

  it(`should not return a response when the cache isn't populated`, async function() {
    const requestWrapper = new RequestWrapper({cacheName: CACHE_NAME});
    const cacheOnly = new CacheOnly({requestWrapper});

    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    const handleResponse = await cacheOnly.handle({event});

    expect(handleResponse).not.to.exist;
  });

  it(`should return the cached response when the cache is populated`, async function() {
    const requestWrapper = new RequestWrapper({cacheName: CACHE_NAME});
    const cacheOnly = new CacheOnly({requestWrapper});

    const cachedResponse = new Response('response body');
    const cache = await caches.open(CACHE_NAME);
    await cache.put(COUNTER_URL, cachedResponse.clone());

    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    const handleResponse = await cacheOnly.handle({event});

    await expectSameResponseBodies(cachedResponse, handleResponse);
  });
});
