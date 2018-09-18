import {expect} from 'chai';
import sinon from 'sinon';

import expectError from '../../../../infra/testing/expectError';
import {cacheWrapper} from '../../../../packages/workbox-core/_private/cacheWrapper.mjs';
import {devOnly} from '../../../../infra/testing/env-it';
import {registerQuotaErrorCallback} from '../../../../packages/workbox-core/_private/quota.mjs';

describe(`workbox-core cacheWrapper`, function() {
  let sandbox;

  before(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe(`.put()`, function() {
    // TODO Add Error Case Tests (I.e. bad input)

    it(`should work with a request and response`, async function() {
      const testCache = await caches.open('TEST-CACHE');
      const cacheOpenStub = sandbox.stub(global.caches, 'open');
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

    it(`should not cache opaque responses by default`, async function() {
      const testCache = await caches.open('TEST-CACHE');
      const cacheOpenStub = sandbox.stub(global.caches, 'open');
      const cachePutStub = sandbox.stub(testCache, 'put');
      cacheOpenStub.callsFake(async (cacheName) => {
        return testCache;
      });
      const putRequest = new Request('/test/string');
      const putResponse = new Response('Response for /test/string', {
        // The mock doesn't allow a status of zero due to a bug
        // so mock to 1.
        status: 1,
      });
      await cacheWrapper.put({
        cacheName: 'TODO-CHANGE-ME',
        request: putRequest,
        response: putResponse,
      });

      expect(cacheOpenStub.callCount).to.equal(0);
      expect(cachePutStub.callCount).to.equal(0);
    });

    devOnly.it(`should not cache POST responses`, async function() {
      const testCache = await caches.open('TEST-CACHE');
      const cacheOpenStub = sandbox.stub(global.caches, 'open');
      const cachePutStub = sandbox.stub(testCache, 'put');
      cacheOpenStub.callsFake(async (cacheName) => {
        return testCache;
      });
      const putRequest = new Request('/test/string');
      const putResponse = new Response('Response for /test/string', {
        method: 'POST',
      });

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
      const putResponse = new Response('Response for /test/string');
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
        expect(pluginSpy.calledWith(sinon.match({
          cacheName: 'TODO-CHANGE-ME',
          request: putRequest,
          oldResponse: null,
          newResponse: putResponse,
        }))).to.be.true;

        // Reset so the spies are clean for next step in the test.
        pluginSpy.resetHistory();
      });

      const putResponseUpdate = new Response('Response for /test/string number 2');
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
        expect(pluginSpy.calledWith(sinon.match({
          cacheName: 'TODO-CHANGE-ME',
          request: putRequest,
          oldResponse: putResponse,
          newResponse: putResponseUpdate,
        }))).to.be.true;
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

    it(`should call the quota exceeded callbacks when there's a QuotaExceeded error`, async function() {
      const callback1 = sandbox.stub();
      registerQuotaErrorCallback(callback1);
      const callback2 = sandbox.stub();
      registerQuotaErrorCallback(callback2);

      const cacheName = 'test-cache';
      const testCache = await caches.open(cacheName);
      sandbox.stub(global.caches, 'open').returns(Promise.resolve(testCache));
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
      sandbox.stub(global.caches, 'open').returns(Promise.resolve(testCache));
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
    it(`should call cachedResponseWillBeUsed`, async function() {
      const options = {};
      const matchCacheName = 'MATCH-CACHE-NAME';
      const matchRequest = new Request('/test/string');
      const matchResponse = new Response('Response for /test/string');

      const firstPluginResponse = new Response('Response for /test/string/1');
      const secondPluginResponse = new Response('Response for /test/string/2');
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
          expect(cachedResponse).to.equal(matchResponse);
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
          expect(cachedResponse).to.equal(firstPluginResponse);
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

      expect(result).to.equal(secondPluginResponse);
      expect(spyOne.callCount).to.equal(1);
      expect(spyTwo.callCount).to.equal(1);
    });
  });
});
