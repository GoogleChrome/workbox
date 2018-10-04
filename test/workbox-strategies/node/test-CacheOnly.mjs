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
import {CacheOnly} from '../../../packages/workbox-strategies/CacheOnly.mjs';
import {compareResponses} from '../utils/response-comparisons.mjs';
import expectError from '../../../infra/testing/expectError';

describe(`[workbox-strategies] CacheOnly.makeRequest()`, function() {
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

  it(`should return the cached response when the cache is populated, when passed a URL string`, async function() {
    const url = 'http://example.io/test/';
    const request = new Request(url);

    const injectedResponse = new Response('response body');
    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    await cache.put(request, injectedResponse.clone());

    const cacheOnly = new CacheOnly();
    const handleResponse = await cacheOnly.makeRequest({
      request: url,
    });
    await compareResponses(injectedResponse, handleResponse, true);
  });

  it(`should be able to make a request when passed a Request object`, async function() {
    const request = new Request('http://example.io/test/');

    const injectedResponse = new Response('response body');
    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    await cache.put(request, injectedResponse.clone());

    const cacheOnly = new CacheOnly();
    const handleResponse = await cacheOnly.makeRequest({
      request,
    });
    await compareResponses(injectedResponse, handleResponse, true);
  });
});

describe(`[workbox-strategies] CacheOnly.handle()`, function() {
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

  it(`should not return a response when the cache isn't populated`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    const cacheOnly = new CacheOnly();
    await expectError(
        () => cacheOnly.handle({event}),
        'no-response'
    );
  });

  it(`should return the cached response when the cache is populated`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    const injectedResponse = new Response('response body');
    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    await cache.put(request, injectedResponse.clone());

    const cacheOnly = new CacheOnly();
    const handleResponse = await cacheOnly.handle({event});
    await compareResponses(injectedResponse, handleResponse, true);
  });

  it(`should return no cached response from custom cache name`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    const injectedResponse = new Response('response body');
    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    await cache.put(request, injectedResponse.clone());

    const cacheOnly = new CacheOnly({cacheName: 'test-cache-name'});
    await expectError(
        () => cacheOnly.handle({event}),
        'no-response'
    );
  });

  it(`should return cached response from custom cache name`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    const injectedResponse = new Response('response body');
    const cache = await caches.open(_private.cacheNames.getRuntimeName('test-cache-name'));
    await cache.put(request, injectedResponse.clone());

    const cacheOnly = new CacheOnly({cacheName: 'test-cache-name'});
    const handleResponse = await cacheOnly.handle({event});
    await compareResponses(injectedResponse, handleResponse, true);
  });

  it(`should return the cached response from plugin.cachedResponseWillBeUsed`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    const injectedResponse = new Response('response body');
    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    await cache.put(request, injectedResponse.clone());

    const pluginResponse = new Response('plugin response');
    const cacheOnly = new CacheOnly({
      plugins: [
        {
          cachedResponseWillBeUsed: () => {
            return pluginResponse;
          },
        },
      ],
    });
    const handleResponse = await cacheOnly.handle({event});
    await compareResponses(pluginResponse, handleResponse, true);
  });

  it(`should use the CacheQueryOptions when performing a cache match`, async function() {
    const matchStub = sandbox.stub(Cache.prototype, 'match').resolves(new Response());

    const matchOptions = {ignoreSearch: true};
    const cacheOnly = new CacheOnly({matchOptions});

    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    await cacheOnly.handle({event});

    expect(matchStub.calledOnce).to.be.true;
    expect(matchStub.calledWith(request, matchOptions)).to.be.true;
  });
});
