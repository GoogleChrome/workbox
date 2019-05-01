/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cacheWrapper} from 'workbox-core/_private/cacheWrapper.mjs';
import {registerQuotaErrorCallback} from 'workbox-core/registerQuotaErrorCallback.mjs';


describe(`cacheWrapper`, function() {
  let sandbox = sinon.createSandbox();

  beforeEach(async function() {
    const cacheKeys = await caches.keys();
    for (const cacheKey of cacheKeys) {
      await caches.delete(cacheKey);
    }
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe(`.put()`, function() {
    // TODO Add Error Case Tests (I.e. bad input)

    it(`should work with a request and response`, async function() {
      const testCache = await caches.open('TEST-CACHE');
      const cacheOpenStub = sandbox.stub(self.caches, 'open');
      const cachePutStub = sandbox.stub(testCache, 'put');
      cacheOpenStub.callsFake(async (cacheName) => {
        return testCache;
      });
      const putRequest = new Request('/test/string');
      const putResponse = new Response('Response for /test/string');
      await cacheWrapper.put({
        cacheName: 'TODO-CHANGE-ME',
        request: putRequest,
        response: putResponse,
      });

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

        await cacheWrapper.put({
          cacheName,
          request: putRequest,
          response: putResponse,
        });

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

      await expectError(async () => {
        await cacheWrapper.put({
          cacheName: 'CACHE NAME',
          request: putRequest,
          response: putResponse,
        });
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

      await cacheWrapper.put({
        cacheName: 'TODO-CHANGE-ME',
        request: putRequest,
        response: putResponse,
        plugins: [
          firstPlugin,
          {
            // Should work without require functions
          },
          secondPlugin,
        ],
      });

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

      await cacheWrapper.put({
        cacheName: 'TODO-CHANGE-ME',
        request: putRequest,
        response: putResponseUpdate,
        plugins: [
          firstPlugin,
          {
            // Should work without require functions
          },
          secondPlugin,
        ],
      });

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
      const fetchEvent = new FetchEvent('fetch', {request: putRequest});

      await cacheWrapper.put({
        cacheName: 'TODO-CHANGE-ME',
        request: putRequest,
        response: putResponse,
        event: fetchEvent,
        plugins: [
          firstPlugin,
          {
            // Should work without require functions
          },
          secondPlugin,
        ],
      });

      expect(spyOne.callCount).to.equal(1);
      expect(spyOne.calledWith(sinon.match({
        request: putRequest,
        response: putResponse,
        event: fetchEvent,
      }))).to.be.true;
      expect(spyTwo.callCount).to.equal(1);
      expect(spyTwo.calledWith(sinon.match({
        request: putRequest,
        response: firstPluginResponse,
        event: fetchEvent,
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

      await cacheWrapper.put({
        response,
        cacheName,
        request: initialRequest,
        plugins: [
          firstPlugin,
          {}, // Intentionally empty to ensure it's filtered out.
          secondPlugin,
        ],
      });

      expect(spyOne.calledOnceWith({
        mode: 'write',
        request: initialRequest,
      })).to.be.true;
      expect(spyOne.thisValues[0]).to.eql(firstPlugin);

      expect(spyTwo.calledOnceWith({
        mode: 'write',
        request: firstPluginReturnValue,
      })).to.be.true;
      expect(spyTwo.thisValues[0]).to.eql(secondPlugin);

      expect(cachePutStub.calledOnce).to.be.true;
      // Check the url of the Request passed to cache.put().
      expect(cachePutStub.args[0][0].url).to.eql(`${self.location.origin}/secondPlugin`);
      expect(cachePutStub.args[0][1]).to.eql(response);
    });

    it(`should throw an error in development when the cacheKeyWillBeUsed return is invalid `, async function() {
      if (process.env.NODE_ENV === 'production') this.skip();

      const request = new Request('/');
      const response = new Response('');

      const plugin = {
        cacheKeyWillBeUsed: () => null,
      };
      const spy = sandbox.spy(plugin, 'cacheKeyWillBeUsed');

      await expectError(async () => {
        await cacheWrapper.put({
          cacheName: 'test-cache-name',
          request,
          response,
          plugins: [plugin],
        });
      }, 'incorrect-class');

      expect(spy.calledOnceWith({
        request,
        mode: 'write',
      })).to.be.true;
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

      try {
        await cacheWrapper.put({
          cacheName,
          request: 'ignored',
          response: new Response(),
        });
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

      try {
        await cacheWrapper.put({
          cacheName,
          request: 'ignored',
          response: new Response(),
        });
        throw new Error('Unexpected success.');
      } catch (error) {
        expect(error.name).to.eql('NetworkError');
      }
      expect(callback.called).to.be.false;
    });
  });

  describe(`.match()`, function() {
    it(`should use the matchOptions that were provided to put()`, async function() {
      const matchOptions = {
        ignoreSearch: true,
      };
      const cacheName = 'test-cache';

      const testCache = await caches.open(cacheName);
      sandbox.stub(self.caches, 'open').resolves(testCache);
      const matchSpy = sandbox.spy(testCache, 'match');

      await cacheWrapper.put({
        cacheName,
        matchOptions,
        plugins: [{
          cacheDidUpdate: () => {},
        }],
        request: new Request('/test/request'),
        response: new Response('test'),
      });

      expect(matchSpy.calledOnce).to.be.true;
      expect(matchSpy.args[0][1]).to.eql(matchOptions);
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

      const result = await cacheWrapper.match({
        cacheName: matchCacheName,
        request: matchRequest,
        matchOptions: options,
        plugins: [
          firstPlugin,
          {
            // Should work without require functions
          },
          secondPlugin,
        ],
      });

      expect(result.headers.get('x-id'))
          .to.equal(secondPluginResponse.headers.get('x-id'));
      expect(spyOne.callCount).to.equal(1);
      expect(spyTwo.callCount).to.equal(1);
    });

    it(`should call cacheKeyWillBeUsed`, async function() {
      const cacheName = 'cacheKeyWillBeUsed-test-cache';
      const cache = await caches.open(cacheName);
      sandbox.stub(caches, 'open').resolves(cache);
      const cacheMatchStub = sandbox.stub(cache, 'match').resolves(
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

      await cacheWrapper.match({
        cacheName,
        request: initialRequest,
        plugins: [
          firstPlugin,
          {}, // Intentionally empty to ensure it's filtered out.
          secondPlugin,
        ],
      });

      expect(spyOne.calledOnceWith({
        mode: 'read',
        request: initialRequest,
      })).to.be.true;
      expect(spyOne.thisValues[0]).to.eql(firstPlugin);

      expect(spyTwo.calledOnceWith({
        mode: 'read',
        request: firstPluginReturnValue,
      })).to.be.true;
      expect(spyTwo.thisValues[0]).to.eql(secondPlugin);

      expect(cacheMatchStub.calledOnce).to.be.true;
      // Check the url of the Request passed to cache.put().
      expect(cacheMatchStub.args[0][0].url).to.eql(`${self.location.origin}/secondPlugin`);
    });

    it(`should throw an error in development when the cacheKeyWillBeUsed return is invalid `, async function() {
      if (process.env.NODE_ENV === 'production') this.skip();

      const request = new Request('/');

      const plugin = {
        cacheKeyWillBeUsed: () => null,
      };
      const spy = sandbox.spy(plugin, 'cacheKeyWillBeUsed');

      await expectError(async () => {
        await cacheWrapper.match({
          request,
          cacheName: 'test-cache-name',
          plugins: [plugin],
        });
      }, 'incorrect-class');

      expect(spy.calledOnceWith({
        request,
        mode: 'read',
      })).to.be.true;
    });
  });
});
