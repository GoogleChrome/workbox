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

importScripts('/packages/workbox-runtime-caching/test/utils/setup.js');

describe(`Test of the RequestWrapper class`, function() {
  const CACHE_NAME = location.href;
  const CACHE_WILL_UPDATE_PLUGIN = {cacheWillUpdate: () => {}};
  const CACHE_WILL_MATCH_PLUGIN = {cachedResponseWillBeUsed: () => {}};
  const CACHED_URL = '/cached';
  const REDIRECTED_URL = '/__test/redirect/301/';

  let globalStubs = [];

  beforeEach(async function() {
    await caches.delete(CACHE_NAME);
  });

  afterEach(function() {
    globalStubs.forEach((stub) => stub.restore());
    globalStubs = [];
  });

  it(`should throw when RequestWrapper() is called with an invalid cacheName parameter`, function() {
    expect(() => {
      new RequestWrapper({cacheName: []});
    }).to.throw().with.property('name', 'assertion-failed');
  });

  it(`should throw when RequestWrapper() is called with an invalid fetchOptions parameter`, function() {
    expect(() => {
      new RequestWrapper({fetchOptions: 'invalid'});
    }).to.throw().with.property('name', 'assertion-failed');
  });

  it(`should throw when RequestWrapper() is called with an invalid matchOptions parameter`, function() {
    expect(() => {
      new RequestWrapper({matchOptions: 'invalid'});
    }).to.throw().with.property('name', 'assertion-failed');
  });

  it(`should throw when RequestWrapper() is called with an invalid plugins parameter`, function() {
    expect(() => {
      new RequestWrapper({plugins: [1]});
    }).to.throw().with.property('name', 'assertion-failed');
  });

  it(`should throw when RequestWrapper() is called with multiple cacheWillUpdate plugins`, function() {
    expect(() => {
      new RequestWrapper({
        plugins: [
          CACHE_WILL_UPDATE_PLUGIN,
          CACHE_WILL_UPDATE_PLUGIN,
        ],
      });
    }).to.throw().with.property('name', 'multiple-cache-will-update-plugins');
  });

  it(`should throw when RequestWrapper() is called with multiple cachedResponseWillBeUsed plugins`, function() {
    expect(() => {
      new RequestWrapper({
        plugins: [
          CACHE_WILL_MATCH_PLUGIN,
          CACHE_WILL_MATCH_PLUGIN,
        ],
      });
    }).to.throw().with.property('name', 'multiple-cached-response-will-be-used-plugins');
  });

  it(`it should throw when RequestWrapper() is called with invalid cacheId`, function() {
    expect(() => {
      new RequestWrapper({cacheId: {}});
    }).to.throw().with.property('name', 'bad-cache-id');
  });

  it(`it should include cacheId in the cacheName`, function() {
    const CACHE_ID = 'CacheIdTest';
    const runtimeCaching = new RequestWrapper({cacheId: CACHE_ID});
    runtimeCaching.cacheName.indexOf(CACHE_ID).should.not.equal(-1);
  });

  it(`it should include cacheId in the cacheName`, function() {
    const CACHE_ID = 'CacheIdTest';
    const CACHE_NAME = 'CacheNameTest';
    const runtimeCaching = new RequestWrapper({
      cacheId: CACHE_ID,
      cacheName: CACHE_NAME,
    });
    runtimeCaching.cacheName.indexOf(CACHE_ID).should.not.equal(-1);
    runtimeCaching.cacheName.indexOf(CACHE_NAME).should.not.equal(-1);
  });

  it(`should return an valid Cache instance when getCache() is called`, async function() {
    const requestWrapper = new RequestWrapper();
    const cache = await requestWrapper.getCache();

    expect(cache).to.be.instanceOf(Cache);
  });

  it(`should find an entry in the correct cache when match() is called`, async function() {
    const requestWrapper = new RequestWrapper({cacheName: CACHE_NAME});

    const cachedResponse = new Response('response body');
    const cache = await caches.open(CACHE_NAME);
    await cache.put(CACHED_URL, cachedResponse.clone());

    const matchResponse = await requestWrapper.match({request: CACHED_URL});

    await expectSameResponseBodies(cachedResponse, matchResponse);
  });

  it(`should correctly respect matchOptions when performing a match()`, async function() {
    const cachedUrlWithSearchParams = `${CACHED_URL}?k=v`;

    const requestWrapperWithoutMatchOptions = new RequestWrapper(
      {cacheName: CACHE_NAME});
    const requestWrapperWithMatchOptions = new RequestWrapper(
      {cacheName: CACHE_NAME, matchOptions: {ignoreSearch: true}});

    const cachedResponse = new Response('response body');
    const cache = await caches.open(CACHE_NAME);
    await cache.put(cachedUrlWithSearchParams, cachedResponse.clone());

    const cacheMissResponse = await requestWrapperWithoutMatchOptions.match(
      {request: CACHED_URL});

    expect(cacheMissResponse).not.to.exist;

    const matchResponse = await requestWrapperWithMatchOptions.match(
      {request: CACHED_URL});

    await expectSameResponseBodies(cachedResponse, matchResponse);
  });

  it(`should fulfill the match() promise with the value returned by a cachedResponseWillBeUsed callback`, async function() {
    const testResponse = new Response('test');
    const cachedResponseWillBeUsedPlugin = {cachedResponseWillBeUsed: () => testResponse};
    const requestWrapper = new RequestWrapper({
      cacheName: CACHE_NAME,
      plugins: [cachedResponseWillBeUsedPlugin],
    });

    const matchResponse = await requestWrapper.match({request: CACHED_URL});

    expect(matchResponse).to.eql(testResponse);
  });

  it(`should return a response from the network when fetch() is called`, async function() {
    const requestWrapper = new RequestWrapper();
    const fetchResponse = await requestWrapper.fetch({request: CACHED_URL});

    expect(fetchResponse).to.be.instanceOf(Response);
  });

  it(`should allow a requestWillFetch to modify the request when fetch() is called`, async function() {
    const fetchStub = sinon.stub(self, 'fetch');
    globalStubs.push(fetchStub);

    const testRequest = new Request('/test');
    const requestWillFetch = {requestWillFetch: () => Promise.resolve(testRequest)};
    const requestWrapper = new RequestWrapper({
      plugins: [requestWillFetch],
    });
    await requestWrapper.fetch({request: CACHED_URL});

    expect(fetchStub.getCall(0).args[0]).to.eql(testRequest);
  });

  it(`should call fetchDidFail when fetch() is called and the network request fails`, function(done) {
    const errorName = 'NetworkError';
    globalStubs.push(sinon.stub(self, 'fetch').throws(errorName));

    const fetchDidFailSpy = sinon.spy();
    const fetchDidFail = {fetchDidFail: fetchDidFailSpy};
    const requestWrapper = new RequestWrapper({
      plugins: [fetchDidFail],
    });
    // This promise should reject, so call done() passing in an error string
    // if it resolves, and done() without an error if it rejects.
    requestWrapper.fetch({request: CACHED_URL})
      .then(() => done(new Error('The promise should have rejected.')))
      .catch((error) => {
        expect(fetchDidFailSpy.firstCall.args[0].request).to.be.instanceOf(Request);
        expect(error.name).to.eql(errorName);
        done();
      });
  });

  it(`should cache the response when fetchAndCache() is called and cacheWillUpdate returns true`, async function() {
    const cacheWillUpdate = {cacheWillUpdate: () => true};
    const requestWrapper = new RequestWrapper({
      plugins: [cacheWillUpdate],
    });

    const cache = await requestWrapper.getCache();

    const cachePutStub = sinon.stub(cache, 'put');
    globalStubs.push(cachePutStub);

    await requestWrapper.fetchAndCache({request: CACHED_URL, waitOnCache: true});

    expect(cachePutStub.firstCall.args[0]).to.eql(CACHED_URL);
    expect(cachePutStub.firstCall.args[1]).to.be.instanceOf(Response);
  });

  it(`should reject without caching the response when fetchAndCache() is called and cacheWillUpdate returns false`, function(done) {
    const cacheWillUpdate = {cacheWillUpdate: () => false};
    const requestWrapper = new RequestWrapper({
      plugins: [cacheWillUpdate],
    });

    requestWrapper.getCache().then((cache) => {
      const cachePutStub = sinon.stub(cache, 'put');
      globalStubs.push(cachePutStub);

      // This promise should reject, so call done() passing in an error string
      // if it resolves, and done() without an error if it rejects.
      requestWrapper.fetchAndCache({request: CACHED_URL, waitOnCache: true})
        .then(() => done(new Error('The promise should have rejected.')))
        .catch((error) => {
          expect(cachePutStub.firstCall).to.be.null;
          expect(error.name).to.eql('invalid-response-for-caching');
          done();
        });
    });
  });

  it(`should cache a non-redirected response when fetchAndCache() is called with cleanRedirects set to true`, async function() {
    const requestWrapper = new RequestWrapper();

    const cache = await requestWrapper.getCache();

    const cachePutStub = sinon.stub(cache, 'put');
    globalStubs.push(cachePutStub);

    await requestWrapper.fetchAndCache({
      request: REDIRECTED_URL,
      waitOnCache: true,
      cleanRedirects: true,
    });

    const [url, response] = cachePutStub.firstCall.args;

    expect(url).to.eql(REDIRECTED_URL);
    expect(response).to.be.instanceOf(Response);
    expect(response.redirected).to.be.false;
  });

  it(`should cache a redirected response when fetchAndCache() is called and cleanRedirects isn't set`, async function() {
    const requestWrapper = new RequestWrapper();

    const cache = await requestWrapper.getCache();

    const cachePutStub = sinon.stub(cache, 'put');
    globalStubs.push(cachePutStub);

    await requestWrapper.fetchAndCache({
      request: REDIRECTED_URL,
      waitOnCache: true,
    });

    const [url, response] = cachePutStub.firstCall.args;

    expect(url).to.eql(REDIRECTED_URL);
    expect(response).to.be.instanceOf(Response);
    expect(response.redirected).to.be.true;
  });
});
