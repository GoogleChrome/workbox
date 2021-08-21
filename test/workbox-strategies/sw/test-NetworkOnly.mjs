/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cacheNames} from 'workbox-core/_private/cacheNames.mjs';
import {NetworkOnly} from 'workbox-strategies/NetworkOnly.mjs';
import {spyOnEvent} from '../../../infra/testing/helpers/extendable-event-utils.mjs';
import {generateUniqueResponse} from '../../../infra/testing/helpers/generateUniqueResponse.mjs';
import {sleep} from '../../../infra/testing/helpers/sleep.mjs';

describe(`NetworkOnly`, function () {
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
    it(`should return a response without adding anything to the cache when the network request is successful`, async function () {
      sandbox.stub(self, 'fetch').resolves(generateUniqueResponse());

      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const networkOnly = new NetworkOnly();

      const handleResponse = await networkOnly.handle({
        request,
        event,
      });
      expect(handleResponse).to.be.instanceOf(Response);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const keys = await cache.keys();
      expect(keys).to.be.empty;
    });

    it(`should support using a string as the request`, async function () {
      sandbox.stub(self, 'fetch').resolves(generateUniqueResponse());

      const stringRequest = 'http://example.io/test/';
      const request = new Request(stringRequest);
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const networkOnly = new NetworkOnly();

      const handleResponse = await networkOnly.handle({
        request: stringRequest,
        event,
      });
      expect(handleResponse).to.be.instanceOf(Response);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const keys = await cache.keys();
      expect(keys).to.be.empty;
    });

    it(`should reject when the network request fails`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      sandbox.stub(self, 'fetch').callsFake(() => {
        return Promise.reject(new Error(`Injected Error`));
      });

      const networkOnly = new NetworkOnly();
      await expectError(
        () =>
          networkOnly.handle({
            request,
            event,
          }),
        'no-response',
      );
    });

    it(`should use plugins response`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      const pluginRequest = new Request('http://something-else.io/test/');

      sandbox.stub(self, 'fetch').callsFake((req) => {
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

      const handleResponse = await networkOnly.handle({
        request,
        event,
      });
      expect(handleResponse).to.be.instanceOf(Response);

      const cache = await caches.open(cacheNames.getRuntimeName());
      const keys = await cache.keys();
      expect(keys).to.be.empty;
    });

    it(`should use the fetchOptions provided`, async function () {
      const fetchOptions = {credentials: 'include'};
      const networkOnly = new NetworkOnly({fetchOptions});

      const fetchStub = sandbox
        .stub(self, 'fetch')
        .resolves(generateUniqueResponse());
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      await networkOnly.handle({
        request,
        event,
      });

      expect(fetchStub.calledOnce).to.be.true;
      expect(fetchStub.calledWith(request, fetchOptions)).to.be.true;
    });

    it(`should throw if the network request times out`, async function () {
      const request = new Request('http://example.io/test/');
      const event = new FetchEvent('fetch', {request});
      spyOnEvent(event);

      // Use a short timeout to not slow down the test.
      // Note Sinon fake timers do not work with `await timeout()` used
      // in the current `StrategyHandler` implementation.
      const networkTimeoutSeconds = 0.5;
      const sleepLongerThanNetworkTimeout = sleep(
        2 * networkTimeoutSeconds * 1000,
      );

      sandbox.stub(self, 'fetch').callsFake(async () => {
        await sleepLongerThanNetworkTimeout;
        return new Response('Unexpected Response');
      });

      const networkOnly = new NetworkOnly({networkTimeoutSeconds});

      await expectError(
        () => networkOnly.handle({event, request}),
        'no-response',
        (err) => {
          expect(err.details.error.message).to.include(networkTimeoutSeconds);
        },
      );
    });
  });
});
