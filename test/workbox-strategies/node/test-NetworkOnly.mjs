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
import {NetworkOnly} from '../../../packages/workbox-strategies/NetworkOnly.mjs';
import expectError from '../../../infra/testing/expectError';

describe(`[workbox-strategies] NetworkOnly.makeRequest()`, function() {
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

  it(`should return a response without adding anything to the cache when the network request is successful, when passed a URL string`, async function() {
    const url = 'http://example.io/test/';

    const networkOnly = new NetworkOnly();

    const handleResponse = await networkOnly.makeRequest({
      request: url,
    });
    expect(handleResponse).to.be.instanceOf(Response);

    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    const keys = await cache.keys();
    expect(keys).to.be.empty;
  });

  it(`should return a response without adding anything to the cache when the network request is successful, when passed a Request object`, async function() {
    const request = new Request('http://example.io/test/');

    const networkOnly = new NetworkOnly();

    const handleResponse = await networkOnly.makeRequest({
      request,
    });
    expect(handleResponse).to.be.instanceOf(Response);

    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    const keys = await cache.keys();
    expect(keys).to.be.empty;
  });
});

describe(`[workbox-strategies] NetworkOnly.handle()`, function() {
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

  it(`should return a response without adding anything to the cache when the network request is successful`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    const networkOnly = new NetworkOnly();

    const handleResponse = await networkOnly.handle({event});
    expect(handleResponse).to.be.instanceOf(Response);

    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    const keys = await cache.keys();
    expect(keys).to.be.empty;
  });

  it(`should reject when the network request fails`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    sandbox.stub(global, 'fetch').callsFake(() => {
      return Promise.reject(new Error(`Injected Error`));
    });

    const networkOnly = new NetworkOnly();
    await expectError(
        () => networkOnly.handle({event}),
        'no-response'
    );
  });

  it(`should use plugins response`, async function() {
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    const pluginRequest = new Request('http://something-else.io/test/');

    sandbox.stub(global, 'fetch').callsFake((req) => {
      expect(req).to.equal(pluginRequest);
      return Promise.resolve(new Response('Injected Response'));
    });

    const networkOnly = new NetworkOnly({
      plugins: [
        {
          requestWillFetch: () => {
            return pluginRequest;
          },
        },
      ],
    });

    const handleResponse = await networkOnly.handle({event});
    expect(handleResponse).to.be.instanceOf(Response);

    const cache = await caches.open(_private.cacheNames.getRuntimeName());
    const keys = await cache.keys();
    expect(keys).to.be.empty;
  });

  it(`should use the fetchOptions provided`, async function() {
    const fetchOptions = {credentials: 'include'};
    const networkOnly = new NetworkOnly({fetchOptions});

    const fetchStub = sandbox.stub(global, 'fetch').resolves(new Response());
    const request = new Request('http://example.io/test/');
    const event = new FetchEvent('fetch', {request});

    await networkOnly.handle({event});

    expect(fetchStub.calledOnce).to.be.true;
    expect(fetchStub.calledWith(request, fetchOptions)).to.be.true;
  });
});
