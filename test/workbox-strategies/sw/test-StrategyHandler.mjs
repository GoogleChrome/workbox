/*
  Copyright 2020 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {Deferred} from 'workbox-core/_private/Deferred.mjs';
import {timeout} from 'workbox-core/_private/timeout.mjs';
import {registerQuotaErrorCallback} from 'workbox-core/registerQuotaErrorCallback.mjs';
import {Strategy} from 'workbox-strategies/Strategy.mjs';
import {StrategyHandler} from 'workbox-strategies/StrategyHandler.mjs';
import {spyOnEvent, eventDoneWaiting} from '../../../infra/testing/helpers/extendable-event-utils.mjs';


class TestStrategy extends Strategy {
  _handle() {
    return new Response('Test response');
  }
}

const createStrategyHandler = (options) => {
  const request = new Request('/handler-request');
  const event = new FetchEvent('fetch', {request});
  const url = new URL(request.url);
  const params = {a: 1, b: 2};

  spyOnEvent(event);

  // First arg should be a `Strategy` instance, but the options just get
  // copied to the instance anyway, so an object will suffice.
  // return new StrategyHandler(options, {request, event});
  return new StrategyHandler(new TestStrategy(options), {
    request,
    event,
    url,
    params,
  });
};

describe(`StrategyHandler`, function() {
  const sandbox = sinon.createSandbox();

  beforeEach(async function() {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    sandbox.restore();
  });

  afterEach(async function() {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    sandbox.restore();
  });

  describe('constructor()', function() {
    it(`should throw when called without an 'event' parameter in dev`, async function() {
      if (process.env.NODE_ENV === 'production') {
        return this.skip();
      }

      await expectError(
          () => new StrategyHandler(new TestStrategy(), {}),
          'incorrect-class',
          (error) => {
            expect(error.details).to.have.property('moduleName').that.equals('workbox-strategies');
            expect(error.details).to.have.property('className').that.equals('StrategyHandler');
            expect(error.details).to.have.property('funcName').that.equals('constructor');
            expect(error.details).to.have.property('paramName').that.equals('options.event');
          },
      );
    });

    it('creates an object with the correct public properties', function() {
      const handler = createStrategyHandler();

      expect(handler.request).to.be.instanceOf(Request);
      expect(handler.event).to.be.instanceOf(ExtendableEvent);
      expect(handler.url).to.be.instanceOf(URL);
      expect(handler.params).to.be.instanceOf(Object);
    });

    it('passes a deferred to event waitUntil (if passed an event)', function() {
      const handler = createStrategyHandler();

      expect(handler.event.waitUntil.callCount).to.equal(1);
      expect(handler.event.waitUntil.firstCall.args[0]).to.be.instanceOf(Promise);
    });
  });

  describe('waitUntil()', function() {
    it('adds promises to an internal queue', function() {
      const handler = createStrategyHandler();

      handler.waitUntil(Promise.resolve());
      expect(handler._extendLifetimePromises).to.have.lengthOf(1);

      handler.waitUntil(Promise.resolve());
      handler.waitUntil(Promise.resolve());
      expect(handler._extendLifetimePromises).to.have.lengthOf(3);
    });

    it('returns the passed promise', function() {
      const handler = createStrategyHandler();
      const promise = Promise.resolve();

      expect(handler.waitUntil(promise)).to.equal(promise);
    });
  });

  describe('doneWaiting()', function() {
    it('returns a promise the resolves once all waitUntil promises have settled', async function() {
      const handler = createStrategyHandler();

      const spy = sandbox.spy();
      const startTime = performance.now();
      handler.waitUntil(timeout(200).then(spy));
      handler.waitUntil(timeout(50).then(spy));
      handler.waitUntil(timeout(100).then(spy));

      await handler.doneWaiting();

      expect(spy.callCount).to.equal(3);
      expect(performance.now() - startTime >= 200).to.be.true;
    });
  });

  describe('destroy()', function() {
    it('resolves any waitUntil promises immediately', function(done) {
      const handler = createStrategyHandler();

      const deferred = new Deferred();
      handler.waitUntil(deferred.promise);

      eventDoneWaiting(handler.event).then(() => {
        deferred.resolve();
        done();
      });

      // Even though the promises passed to `handler.waitUntil()` hasn't
      // resolved, calling `destroy()` should ensure the handler's event can.
      handler.destroy();
    });
  });

  // These tests were copied from `test-fetchWrapper` to ensure we don't
  // lose any of the existing behavior in the update.
  describe(`fetch()`, function() {
    it(`should work with request string`, async function() {
      const stub = sandbox.stub(self, 'fetch').callsFake(() => new Response());

      const handler = createStrategyHandler();
      await handler.fetch('/test/string');

      expect(stub.callCount).to.equal(1);
      const fetchRequest = stub.args[0][0];
      expect(fetchRequest.url).to.equal(`${location.origin}/test/string`);
    });

    it(`should work with Request instance`, async function() {
      const stub = sandbox.stub(self, 'fetch').callsFake(() => new Response());

      const handler = createStrategyHandler();
      await handler.fetch(new Request('/test/response'));

      expect(stub.callCount).to.equal(1);
      const fetchRequest = stub.args[0][0];
      expect(fetchRequest.url).to.equal(`${location.origin}/test/response`);
    });

    it(`should use fetchOptions from the strategy`, async function() {
      const stub = sandbox.stub(self, 'fetch').callsFake(() => new Response());

      const fetchOptions = {
        method: 'POST',
        headers: {
          'Custom': 'Header',
        },
        body: 'Example Body',
      };

      const handler = createStrategyHandler({fetchOptions});
      await handler.fetch('/test/fetchOptions');

      expect(stub.callCount).to.equal(1);
      const fetchArgs = stub.args[0];
      expect(fetchArgs[0].url).to.equal(`${location.origin}/test/fetchOptions`);
      expect(fetchArgs[1]).to.deep.equal(fetchOptions);
    });

    it(`should ignore fetchOptions when request.mode === 'navigate'`, async function() {
      // See https://github.com/GoogleChrome/workbox/issues/1796
      const fetchStub = sandbox.stub(self, 'fetch').resolves(new Response());

      const fetchOptions = {
        headers: {
          'X-Test': 'Header',
        },
      };

      const request = new Request('/test/navigateFetchOptions');
      // You normally can't generate a navigation request programmatically,
      // but we can fake it with `Object.defineProperty()` after creation.
      Object.defineProperty(request, 'mode', {value: 'navigate'});

      const handler = createStrategyHandler({fetchOptions});
      await handler.fetch(request);

      expect(fetchStub.calledOnce).to.be.true;
      expect(fetchStub.firstCall.args[0]).to.be.instanceOf(Request);
      expect(fetchStub.firstCall.args[0].url).to.eql(request.url);
      expect(fetchStub.firstCall.args[0].mode).to.eql('navigate');
      expect(fetchStub.firstCall.args[1]).not.to.exist;
    });

    it(`should call the requestWillFetch callback in all strategy plugins and use the returned request`, async function() {
      const fetchStub = sandbox.stub(self, 'fetch').callsFake(() => new Response());

      const stub1 = sandbox.stub().returns(new Request('/test/requestWillFetch/1'));
      const stub2 = sandbox.stub().returns(new Request('/test/requestWillFetch/2'));

      const firstPlugin = {requestWillFetch: stub1};
      const secondPlugin = {requestWillFetch: stub2};

      const handler = createStrategyHandler({
        plugins: [firstPlugin, secondPlugin],
      });

      await handler.fetch('/test/requestWillFetch/0');

      expect(stub1.callCount).equal(1);
      expect(stub1.args[0][0].request.url).to.equal(`${location.origin}/test/requestWillFetch/0`);
      expect(stub1.args[0][0].event).to.equal(handler.event);
      expect(stub2.callCount).equal(1);
      expect(stub2.args[0][0].request.url).to.equal(`${location.origin}/test/requestWillFetch/1`);
      expect(stub2.args[0][0].event).to.equal(handler.event);

      expect(fetchStub.callCount).to.equal(1);

      const fetchRequest = fetchStub.args[0][0];
      expect(fetchRequest.url).to.equal(`${location.origin}/test/requestWillFetch/2`);
    });

    it(`should throw a meaningful error on bad requestWillFetch plugin`, async function() {
      const fetchStub = sandbox.stub(self, 'fetch').callsFake(() => new Response());
      const errorPlugin = {
        requestWillFetch: (request) => {
          throw new Error('Injected Error from Test.');
        },
      };
      const errorPluginSpy = sandbox.spy(errorPlugin, 'requestWillFetch');

      const handler = createStrategyHandler({
        plugins: [errorPlugin],
      });

      await expectError(() => {
        return handler.fetch('/test/requestWillFetch/0');
      }, 'plugin-error-request-will-fetch', (err) => {
        expect(err.details.thrownError).to.exist;
        expect(err.details.thrownError.message).to.equal('Injected Error from Test.');
      });

      expect(errorPluginSpy.callCount).equal(1);
      expect(fetchStub.callCount).to.equal(0);
    });

    it(`should call fetchDidFail method in plugins`, async function() {
      sandbox.stub(self, 'fetch').callsFake(() => {
        return Promise.reject(new Error('Injected Error.'));
      });

      const secondPlugin = {
        fetchDidFail: sandbox.stub().callsFake(({originalRequest, request, event, error}) => {
          expect(originalRequest.url).to.equal(`${location.origin}/test/failingRequest/0`);
          expect(request.url).to.equal(`${location.origin}/test/failingRequest/1`);
          expect(error.message).to.equal('Injected Error.');
        }),
      };

      const firstPlugin = {
        requestWillFetch: ({request}) => {
          return new Request('/test/failingRequest/1');
        },
        fetchDidFail: sandbox.stub().callsFake(({originalRequest, request, event, error}) => {
          // This should be called first
          expect(secondPlugin.fetchDidFail.callCount).to.equal(0);
          expect(originalRequest.url).to.equal(`${location.origin}/test/failingRequest/0`);
          expect(request.url).to.equal(`${location.origin}/test/failingRequest/1`);
          expect(error.message).to.equal('Injected Error.');
        }),
      };

      const handler = createStrategyHandler({
        plugins: [
          firstPlugin,
          {
            // It should be able to handle plugins without the required method.
          },
          secondPlugin,
        ],
      });

      try {
        await handler.fetch('/test/failingRequest/0');
        throw new Error('No error thrown when it was expected.');
      } catch (err) {
        expect(err.message).to.equal('Injected Error.');
      }

      expect(firstPlugin.fetchDidFail.callCount).equal(1);
      expect(secondPlugin.fetchDidFail.callCount).equal(1);
      expect(self.fetch.callCount).to.equal(1);

      const fetchRequest = self.fetch.args[0][0];
      expect(fetchRequest.url).to.equal(`${location.origin}/test/failingRequest/1`);
    });

    it(`should call the fetchDidSucceed method in plugins`, async function() {
      const originalRequest = new Request('/testing');

      sandbox.stub(self, 'fetch').resolves(new Response('', {
        headers: {
          'x-count': 1,
        },
      }));

      const fetchDidSucceed = sandbox.stub().callsFake(({response}) => {
        const count = Number(response.headers.get('x-count'));
        return new Response('', {
          headers: {
            'x-count': count + 1,
          },
        });
      });

      const handler = createStrategyHandler({
        plugins: [
          // Two plugins, both with the same callback.
          {fetchDidSucceed},
          {fetchDidSucceed},
        ],
      });

      const finalResponse = await handler.fetch(originalRequest);

      expect(fetchDidSucceed.callCount).to.eql(2);

      for (const args of fetchDidSucceed.args) {
        expect(args[0].request).to.be.instanceOf(Request);
        expect(args[0].response).to.be.instanceOf(Response);
        expect(args[0].event).to.be.instanceOf(FetchEvent);
      }

      const finalCount = finalResponse.headers.get('x-count');
      expect(finalCount).to.equal('3');
    });
  });

  // These tests were copied from `test-cacheWrapper` to ensure we don't
  // lose any of the existing behavior in the update.
  describe(`.cachePut()`, function() {
    it(`should work with a request and response`, async function() {
      const testCache = await caches.open('TEST-CACHE');
      const cacheOpenStub = sandbox.stub(self.caches, 'open');
      const cachePutStub = sandbox.stub(testCache, 'put');
      cacheOpenStub.callsFake(async (cacheName) => {
        return testCache;
      });
      const putRequest = new Request('/test/string');
      const putResponse = new Response('Response for /test/string');

      const handler = createStrategyHandler({cacheName: 'TODO-CHANGE-ME'});
      await handler.cachePut(putRequest, putResponse);

      expect(cacheOpenStub.callCount).to.equal(1);
      const cacheName1 = cacheOpenStub.args[0][0];
      expect(cacheName1).to.equal('TODO-CHANGE-ME');

      expect(cachePutStub.callCount).to.equal(1);
      const cacheRequest = cachePutStub.args[0][0];
      const cacheResponse = cachePutStub.args[0][1];
      expect(cacheRequest).to.equal(putRequest);
      expect(cacheResponse).to.equal(putResponse);
    });

    // This covers opaque responses (0) and partial content responses (206).
    for (const status of [0, 206]) {
      it(`should not cache response.status of ${status} by default`, async function() {
        const cacheName = 'test-cache';
        const testCache = await caches.open(cacheName);
        const cacheOpenStub = sandbox.stub(self.caches, 'open').resolves(testCache);
        const cachePutSpy = sandbox.spy(testCache, 'put');

        const putRequest = new Request('/test/string');

        const putResponse = new Response('');
        // You normally can't generate a 0 response status programmatically,
        // but we can fake it with `Object.defineProperty()` after creation.
        Object.defineProperty(putResponse, 'status', {value: status});

        const handler = createStrategyHandler({cacheName});
        await handler.cachePut(putRequest, putResponse);

        expect(cacheOpenStub.callCount).to.equal(0);
        expect(cachePutSpy.callCount).to.equal(0);
      });
    }

    it(`should throw when trying to cache POST requests in dev mode`, async function() {
      if (process.env.NODE_ENV === 'production') this.skip();

      const testCache = await caches.open('TEST-CACHE');
      const cacheOpenStub = sandbox.stub(self.caches, 'open');
      const cachePutStub = sandbox.stub(testCache, 'put');
      cacheOpenStub.callsFake(async (cacheName) => {
        return testCache;
      });
      const putRequest = new Request('/test/string', {
        method: 'POST',
      });
      const putResponse = new Response('Response for /test/string');

      const handler = createStrategyHandler({cacheName: 'CACHE NAME'});

      await expectError(async () => {
        await handler.cachePut(putRequest, putResponse);
      }, 'attempt-to-cache-non-get-request');

      expect(cacheOpenStub.callCount).to.equal(0);
      expect(cachePutStub.callCount).to.equal(0);
    });

    it(`should call cacheDidUpdate`, async function() {
      const firstPlugin = {
        cacheDidUpdate: () => {},
      };

      const secondPlugin = {
        cacheDidUpdate: () => {},
      };

      const spyOne = sandbox.spy(firstPlugin, 'cacheDidUpdate');
      const spyTwo = sandbox.spy(secondPlugin, 'cacheDidUpdate');

      const putRequest = new Request('/test/string');
      const putResponse = new Response('Response for /test/string', {
        headers: {'x-id': '1'},
      });

      const handler = createStrategyHandler({
        cacheName: 'TODO-CHANGE-ME',
        plugins: [
          firstPlugin,
          {
            // Should work without require functions
          },
          secondPlugin,
        ],
      });

      await handler.cachePut(putRequest, putResponse);

      [spyOne, spyTwo].forEach((pluginSpy) => {
        expect(pluginSpy.callCount).to.equal(1);
        expect(pluginSpy.args[0][0].cacheName).to.equal('TODO-CHANGE-ME');
        expect(pluginSpy.args[0][0].request).to.equal(putRequest);
        expect(pluginSpy.args[0][0].oldResponse).to.equal(undefined);
        expect(pluginSpy.args[0][0].newResponse).to.equal(putResponse);

        // Reset so the spies are clean for next step in the test.
        pluginSpy.resetHistory();
      });

      const putResponseUpdate = new Response('Response for /test/string number 2', {
        headers: {'x-id': '2'},
      });

      await handler.cachePut(putRequest, putResponseUpdate);

      [spyOne, spyTwo].forEach((pluginSpy) => {
        expect(pluginSpy.callCount).to.equal(1);
        expect(pluginSpy.args[0][0].cacheName).to.equal('TODO-CHANGE-ME');
        expect(pluginSpy.args[0][0].request).to.equal(putRequest);
        expect(pluginSpy.args[0][0].oldResponse.headers.get('x-id')).to.equal('1');
        expect(pluginSpy.args[0][0].newResponse.headers.get('x-id')).to.equal('2');
      });
    });

    it(`should call cacheWillUpdate`, async function() {
      const firstPluginResponse = new Response('Response for /test/string/1');
      const firstPlugin = {
        cacheWillUpdate: () => {
          return firstPluginResponse;
        },
      };

      const secondPlugin = {
        cacheWillUpdate: () => {
          return new Response('Response for /test/string/2');
        },
      };

      const spyOne = sandbox.spy(firstPlugin, 'cacheWillUpdate');
      const spyTwo = sandbox.spy(secondPlugin, 'cacheWillUpdate');

      const putRequest = new Request('/test/string');
      const putResponse = new Response('Response for /test/string');

      const handler = createStrategyHandler({
        cacheName: 'TODO-CHANGE-ME',
        plugins: [
          firstPlugin,
          {
            // Should work without require functions
          },
          secondPlugin,
        ],
      });

      await handler.cachePut(putRequest, putResponse);

      expect(spyOne.callCount).to.equal(1);

      expect(spyOne.calledWith(sinon.match({
        request: putRequest,
        response: putResponse,
        event: handler.event,
      }))).to.be.true;
      expect(spyTwo.callCount).to.equal(1);
      expect(spyTwo.calledWith(sinon.match({
        request: putRequest,
        response: firstPluginResponse,
        event: handler.event,
      }))).to.be.true;
    });

    it(`should call cacheKeyWillBeUsed`, async function() {
      const cacheName = 'cacheKeyWillBeUsed-test-cache';
      const cache = await caches.open(cacheName);
      sandbox.stub(caches, 'open').resolves(cache);
      const cachePutStub = sandbox.stub(cache, 'put').resolves();

      const firstPluginReturnValue = new Request('/firstPlugin');
      const firstPlugin = {
        cacheKeyWillBeUsed: () => firstPluginReturnValue,
      };

      const secondPlugin = {
        // This string will be converted to a Request.
        cacheKeyWillBeUsed: () => '/secondPlugin',
      };

      const spyOne = sandbox.spy(firstPlugin, 'cacheKeyWillBeUsed');
      const spyTwo = sandbox.spy(secondPlugin, 'cacheKeyWillBeUsed');

      const initialRequest = new Request('/noPlugin');
      const response = new Response('Test response.');

      const handler = createStrategyHandler({
        cacheName,
        plugins: [
          firstPlugin,
          {}, // Intentionally empty to ensure it's filtered out.
          secondPlugin,
        ],
      });

      await handler.cachePut(initialRequest, response);

      expect(spyOne.calledOnceWith(sinon.match({
        mode: 'write',
        request: initialRequest,
      }))).to.be.true;
      expect(spyOne.thisValues[0]).to.eql(firstPlugin);

      expect(spyTwo.calledOnceWith(sinon.match({
        mode: 'write',
        request: firstPluginReturnValue,
      }))).to.be.true;
      expect(spyTwo.thisValues[0]).to.eql(secondPlugin);

      expect(cachePutStub.calledOnce).to.be.true;
      // Check the url of the Request passed to cache.put().
      expect(cachePutStub.args[0][0].url).to.eql(`${self.location.origin}/secondPlugin`);
      expect(cachePutStub.args[0][1]).to.eql(response);
    });

    it(`should allow caching of posts if cacheKeyWillBeUsed returns a get request`, async function() {
      const cacheName = 'cacheKeyWillBeUsed-test-cache';
      const cache = await caches.open(cacheName);
      sandbox.stub(caches, 'open').resolves(cache);
      const cachePutStub = sandbox.stub(cache, 'put').resolves();

      const firstPluginReturnValue = new Request('/firstPlugin', {
        method: 'get',
      });

      const firstPlugin = {
        cacheKeyWillBeUsed: () => firstPluginReturnValue,
      };

      const secondPlugin = {
        // This string will be converted to a Request.
        cacheKeyWillBeUsed: () => '/secondPlugin',
      };

      const spyOne = sandbox.spy(firstPlugin, 'cacheKeyWillBeUsed');
      const spyTwo = sandbox.spy(secondPlugin, 'cacheKeyWillBeUsed');

      const initialRequest = new Request('/noPlugin', {
        method: 'post',
      });

      const response = new Response('Test response.');

      const handler = createStrategyHandler({
        cacheName,
        plugins: [
          firstPlugin,
          {}, // Intentionally empty to ensure it's filtered out.
          secondPlugin,
        ],
      });

      await handler.cachePut(initialRequest, response);

      expect(spyOne.calledOnceWith(sinon.match({
        mode: 'write',
        request: initialRequest,
      }))).to.be.true;
      expect(spyOne.thisValues[0]).to.eql(firstPlugin);

      expect(spyTwo.calledOnceWith(sinon.match({
        mode: 'write',
        request: firstPluginReturnValue,
      }))).to.be.true;
      expect(spyTwo.thisValues[0]).to.eql(secondPlugin);

      expect(cachePutStub.calledOnce).to.be.true;
      // Check the url of the Request passed to cache.put().
      expect(cachePutStub.args[0][0].url).to.eql(`${self.location.origin}/secondPlugin`);
      expect(cachePutStub.args[0][1]).to.eql(response);
    });

    it(`should call the quota exceeded callbacks when there's a QuotaExceeded error`, async function() {
      const callback1 = sandbox.stub();
      registerQuotaErrorCallback(callback1);
      const callback2 = sandbox.stub();
      registerQuotaErrorCallback(callback2);

      const cacheName = 'test-cache';
      const testCache = await caches.open(cacheName);
      sandbox.stub(self.caches, 'open').returns(Promise.resolve(testCache));
      sandbox.stub(testCache, 'put').throws('QuotaExceededError');

      const handler = createStrategyHandler({cacheName});

      try {
        await handler.cachePut('ignored', new Response());
        throw new Error('Unexpected success.');
      } catch (error) {
        expect(error.name).to.eql('QuotaExceededError');
      }
      expect(callback1.calledOnce).to.be.true;
      expect(callback2.calledOnce).to.be.true;
    });

    it(`should not call the quota exceeded callbacks when there's a non-QuotaExceeded error`, async function() {
      const callback = sandbox.stub();
      registerQuotaErrorCallback(callback);

      const cacheName = 'test-cache';
      const testCache = await caches.open(cacheName);
      sandbox.stub(self.caches, 'open').returns(Promise.resolve(testCache));
      sandbox.stub(testCache, 'put').throws('NetworkError');

      const handler = createStrategyHandler({cacheName});

      try {
        await handler.cachePut('ignored', new Response());
        throw new Error('Unexpected success.');
      } catch (error) {
        expect(error.name).to.eql('NetworkError');
      }
      expect(callback.called).to.be.false;
    });
  });

  // These tests were copied from `test-cacheWrapper` to ensure we don't
  // lose any of the existing behavior in the update.
  describe(`.cacheMatch()`, function() {
    it(`should use the matchOptions that were provided to put()`, async function() {
      const matchOptions = {
        ignoreSearch: true,
      };
      const cacheName = 'test-cache';

      const matchSpy = sandbox.spy(self.caches, 'match');

      const handler = createStrategyHandler({
        cacheName,
        matchOptions,
        plugins: [{
          cacheDidUpdate: () => {},
        }],
      });

      await handler.cacheMatch(
          new Request('/test/request'), new Response('test'));

      expect(matchSpy.calledOnce).to.be.true;
      expect(matchSpy.args[0][1]).to.eql(Object.assign({}, matchOptions, {
        cacheName,
      }));
    });

    it(`should call cachedResponseWillBeUsed`, async function() {
      const options = {};
      const matchCacheName = 'MATCH-CACHE-NAME';
      const matchRequest = new Request('/test/string');
      const matchResponse = new Response('Response for /test/string', {
        headers: {'x-id': '1'},
      });

      const firstPluginResponse = new Response('Response for /test/string/1', {
        headers: {'x-id': '2'},
      });
      const secondPluginResponse = new Response('Response for /test/string/2', {
        headers: {'x-id': '3'},
      });

      const firstPlugin = {
        cachedResponseWillBeUsed: ({
          cacheName,
          request,
          matchOptions,
          cachedResponse,
        }) => {
          expect(request).to.equal(matchRequest);
          expect(cacheName).to.equal(matchCacheName);
          expect(matchOptions).to.equal(options);
          expect(cachedResponse.headers.get('x-id'))
              .to.equal(matchResponse.headers.get('x-id'));

          return firstPluginResponse;
        },
      };

      const secondPlugin = {
        cachedResponseWillBeUsed: ({
          cacheName,
          request,
          matchOptions,
          cachedResponse,
        }) => {
          expect(request).to.equal(matchRequest);
          expect(cacheName).to.equal(matchCacheName);
          expect(matchOptions).to.equal(options);
          expect(cachedResponse.headers.get('x-id'))
              .to.equal(firstPluginResponse.headers.get('x-id'));
          return secondPluginResponse;
        },
      };

      const spyOne = sandbox.spy(firstPlugin, 'cachedResponseWillBeUsed');
      const spyTwo = sandbox.spy(secondPlugin, 'cachedResponseWillBeUsed');

      const openCache = await caches.open(matchCacheName);
      await openCache.put(matchRequest, matchResponse);

      const handler = createStrategyHandler({
        cacheName: matchCacheName,
        matchOptions: options,
        plugins: [
          firstPlugin,
          {
            // Should work without require functions
          },
          secondPlugin,
        ],
      });

      const result = await handler.cacheMatch(matchRequest);

      expect(result.headers.get('x-id'))
          .to.equal(secondPluginResponse.headers.get('x-id'));
      expect(spyOne.callCount).to.equal(1);
      expect(spyTwo.callCount).to.equal(1);
    });

    it(`should call cacheKeyWillBeUsed`, async function() {
      const cacheName = 'cacheKeyWillBeUsed-test-cache';
      const cacheMatchStub = sandbox.stub(self.caches, 'match').resolves(
          new Response('Test response.'));

      const firstPluginReturnValue = new Request('/firstPlugin');
      const firstPlugin = {
        cacheKeyWillBeUsed: () => firstPluginReturnValue,
      };

      const secondPlugin = {
        // This string will be converted to a Request.
        cacheKeyWillBeUsed: () => '/secondPlugin',
      };

      const spyOne = sandbox.spy(firstPlugin, 'cacheKeyWillBeUsed');
      const spyTwo = sandbox.spy(secondPlugin, 'cacheKeyWillBeUsed');

      const initialRequest = new Request('/noPlugin');

      const handler = createStrategyHandler({
        cacheName,
        request: initialRequest,
        plugins: [
          firstPlugin,
          {}, // Intentionally empty to ensure it's filtered out.
          secondPlugin,
        ],
      });

      await handler.cacheMatch(initialRequest);

      expect(spyOne.calledOnceWith(sinon.match({
        mode: 'read',
        request: initialRequest,
      }))).to.be.true;
      expect(spyOne.thisValues[0]).to.eql(firstPlugin);

      expect(spyTwo.calledOnceWith(sinon.match({
        mode: 'read',
        request: firstPluginReturnValue,
      }))).to.be.true;
      expect(spyTwo.thisValues[0]).to.eql(secondPlugin);

      expect(cacheMatchStub.calledOnce).to.be.true;
      // Check the url of the Request passed to cache.put().
      expect(cacheMatchStub.args[0][0].url).to.eql(`${self.location.origin}/secondPlugin`);
    });
  });

  describe('fetchAndCachePut()', function() {
    it('calls fetch and then cachePut with the response', async function() {
      const handler = createStrategyHandler();

      sandbox.stub(self, 'fetch').resolves(new Response('fetch response'));
      sandbox.stub(Cache.prototype, 'put');

      sandbox.spy(handler, 'fetch');
      sandbox.spy(handler, 'cachePut');

      const response = await handler.fetchAndCachePut('/test');
      expect(handler.fetch.callCount).to.equal(1);
      expect(await response.text()).to.equal('fetch response');

      expect(handler.cachePut.callCount).to.equal(1);
      const spyCall = handler.cachePut.firstCall;
      expect(spyCall.args[0]).to.equal('/test');
      expect(await spyCall.args[1].text()).to.equal('fetch response');
    });

    it(`should work with request string`, async function() {
      const handler = createStrategyHandler();

      sandbox.stub(self, 'fetch').resolves(new Response('fetch response'));

      const response = await handler.fetchAndCachePut('/url');
      expect(await response.text()).to.equal('fetch response');

      expect(self.fetch.args[0][0]).to.be.instanceOf(Request);
      expect(self.fetch.args[0][0].url).to.equal(location.origin + '/url');
    });

    it(`should work with request object`, async function() {
      const handler = createStrategyHandler();

      sandbox.stub(self, 'fetch').resolves(new Response('fetch response'));

      const response = await handler.fetchAndCachePut(new Request('/request'));
      expect(await response.text()).to.equal('fetch response');

      expect(self.fetch.args[0][0]).to.be.instanceOf(Request);
      expect(self.fetch.args[0][0].url).to.equal(location.origin + '/request');
    });

    it(`should keep the handler alive until the cache put settles`, async function() {
      const handler = createStrategyHandler();

      sandbox.stub(self, 'fetch').resolves(new Response('fetch response'));
      sandbox.spy(handler, 'cachePut');
      sandbox.spy(handler, 'waitUntil');

      handler.fetchAndCachePut('/url');

      await handler.doneWaiting();
      expect(handler.waitUntil.calledWith(
          handler.cachePut.firstCall.returnValue)).to.be.true;
    });
  });

  describe('hasCallback()', function() {
    it('return true if the strategy contains at least one plugin with the given callback', function() {
      const handler = createStrategyHandler({
        plugins: [
          {
            handlerWillStart: sandbox.spy(),
          },
          {
            handlerWillStart: sandbox.spy(),
            handlerDidComplete: sandbox.spy(),
          },
          {
            // Empty plugin.
          },
          {
            requestWillFetch: sandbox.spy(),
          },
        ],
      });

      expect(handler.hasCallback('handlerWillStart')).to.equal(true);
      expect(handler.hasCallback('handlerDidComplete')).to.equal(true);
      expect(handler.hasCallback('requestWillFetch')).to.equal(true);
      expect(handler.hasCallback('cacheKeyWillBeUsed')).to.equal(false);
      expect(handler.hasCallback('fetchDidFail')).to.equal(false);
    });
  });

  describe('runCallbacks()', function() {
    it('runs all matching callbacks with the correct arguments', async function() {
      const spy = sandbox.spy();
      const handler = createStrategyHandler({
        plugins: [
          {
            handlerWillStart: spy,
          },
          {
            // Empty plugin.
          },
          {
            handlerWillStart: spy,
          },
        ],
      });

      const request = new Request('test-request');
      const event = new FetchEvent('fetch', {request});

      await handler.runCallbacks('handlerWillStart', {request, event});

      expect(spy.callCount).to.equal(2);

      expect(spy.firstCall.args[0].request).to.equal(request);
      expect(spy.firstCall.args[0].event).to.equal(event);
      expect(spy.firstCall.args[0].state).to.be.instanceOf(Object);

      expect(spy.secondCall.args[0].request).to.equal(request);
      expect(spy.secondCall.args[0].event).to.equal(event);
      expect(spy.secondCall.args[0].state).to.be.instanceOf(Object);
    });

    it('uses a unique state object per plugin', async function() {
      const plugins = [
        {
          handlerWillStart: sandbox.spy(),
          handlerDidComplete: sandbox.spy(),
        },
        {
          handlerWillStart: sandbox.spy(),
        },
        {
          // Empty plugin.
        },
        {
          handlerWillStart: sandbox.spy(),
          handlerDidComplete: sandbox.spy(),
        },
      ];

      const handler = createStrategyHandler({plugins});

      const request = new Request('test-request');
      const event = new FetchEvent('fetch', {request});

      await handler.runCallbacks('handlerWillStart', {request, event});

      // All of the `handlerWillStart` callbacks are from different plugins,
      // so they should all have different state objects.
      expect(plugins[0].handlerWillStart.firstCall.args[0].state)
          .not.to.equal(plugins[1].handlerWillStart.firstCall.args[0].state);
      expect(plugins[1].handlerWillStart.firstCall.args[0].state)
          .not.to.equal(plugins[3].handlerWillStart.firstCall.args[0].state);

      await handler.runCallbacks('handlerDidComplete', {request, event});

      // All of the `handlerDidComplete` callbacks are from different plugins,
      // so they should also all have different state objects.
      expect(plugins[0].handlerDidComplete.firstCall.args[0].state)
          .not.to.equal(plugins[3].handlerDidComplete.firstCall.args[0].state);

      // State objects from callbacks in the same plugin should be the same.
      expect(plugins[0].handlerWillStart.firstCall.args[0].state)
          .to.equal(plugins[0].handlerDidComplete.firstCall.args[0].state);
      expect(plugins[3].handlerWillStart.firstCall.args[0].state)
          .to.equal(plugins[3].handlerDidComplete.firstCall.args[0].state);
    });
  });

  describe('iterateCallbacks()', function() {
    it('loops through all matching callbacks', async function() {
      const spy = sandbox.spy();
      const handler = createStrategyHandler({
        plugins: [
          {
            handlerWillStart: spy,
          },
          {
            // Empty plugin.
          },
          {
            handlerWillStart: spy,
          },
        ],
      });

      const request = new Request('/test-request');
      const event = new FetchEvent('fetch', {request});

      for (const callback of handler.iterateCallbacks('handlerWillStart')) {
        await callback({event, request});

        expect(spy.callCount).to.equal(1);
        expect(spy.firstCall.args[0].request).to.equal(request);
        expect(spy.firstCall.args[0].event).to.equal(event);
        expect(spy.firstCall.args[0].state).to.be.instanceOf(Object);

        spy.resetHistory();
      }
    });

    it('uses a unique state object per plugin', async function() {
      const plugins = [
        {
          handlerWillStart: sandbox.spy(),
          handlerDidComplete: sandbox.spy(),
        },
        {
          handlerWillStart: sandbox.spy(),
        },
        {
          // Empty plugin.
        },
        {
          handlerWillStart: sandbox.spy(),
          handlerDidComplete: sandbox.spy(),
        },
      ];

      const handler = createStrategyHandler({plugins});

      const request = new Request('test-request');
      const event = new FetchEvent('fetch', {request});

      for (const callback of handler.iterateCallbacks('handlerWillStart')) {
        await callback({event, request});
      }

      // All of the `handlerWillStart` callbacks are from different plugins,
      // so they should all have different state objects.
      expect(plugins[0].handlerWillStart.firstCall.args[0].state)
          .not.to.equal(plugins[1].handlerWillStart.firstCall.args[0].state);
      expect(plugins[1].handlerWillStart.firstCall.args[0].state)
          .not.to.equal(plugins[3].handlerWillStart.firstCall.args[0].state);

      for (const callback of handler.iterateCallbacks('handlerDidComplete')) {
        await callback({event, request});
      }

      // All of the `handlerDidComplete` callbacks are from different plugins,
      // so they should also all have different state objects.
      expect(plugins[0].handlerDidComplete.firstCall.args[0].state)
          .not.to.equal(plugins[3].handlerDidComplete.firstCall.args[0].state);

      // State objects from callbacks in the same plugin should be the same.
      expect(plugins[0].handlerWillStart.firstCall.args[0].state)
          .to.equal(plugins[0].handlerDidComplete.firstCall.args[0].state);
      expect(plugins[3].handlerWillStart.firstCall.args[0].state)
          .to.equal(plugins[3].handlerDidComplete.firstCall.args[0].state);
    });

    it('returns the value returned by the callback', async function() {
      let request = new Request('/test-request');
      const event = new FetchEvent('fetch', {request});

      const handler = createStrategyHandler({
        plugins: [
          {
            handlerWillStart({event, request}) {
              return new Request(request.url + '+1');
            },
          },
          {
            // Empty plugin.
          },
          {
            handlerWillStart({event, request}) {
              return new Request(request.url + '+2');
            },
          },
        ],
      });

      for (const callback of handler.iterateCallbacks('handlerWillStart')) {
        request = await callback({event, request});
      }

      expect(request.url).to.equal(location.origin + '/test-request+1+2');
    });
  });
});
