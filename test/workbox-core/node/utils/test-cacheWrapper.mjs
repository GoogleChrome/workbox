import {expect} from 'chai';
import sinon from 'sinon';

// import expectError from '../../../../infra/utils/expectError';
import cacheWrapper from '../../../../packages/workbox-core/utils/cacheWrapper.mjs';

describe(`workbox-core cacheWrapper`, function() {
  let sandbox;

  before(function() {
    sandbox = sinon.sandbox.create();
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
      await cacheWrapper.put('TODO-CHANGE-ME', putRequest, putResponse);

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
      await cacheWrapper.put('TODO-CHANGE-ME', putRequest, putResponse);

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
      await cacheWrapper.put('TODO-CHANGE-ME', putRequest, putResponse, [
        firstPlugin,
        {
          // Should work without require functions
        },
        secondPlugin,
      ]);

      [spyOne, spyTwo].forEach((pluginSpy) => {
        expect(pluginSpy.callCount).to.equal(1);
        expect(pluginSpy.args[0][0]).to.deep.equal({
          cacheName: 'TODO-CHANGE-ME',
        request: putRequest,
        oldResponse: null,
        newResponse: putResponse,
        });

        // Reset so the spies are clean for next step in the test.
        pluginSpy.reset();
      });

      const putResponseUpdate = new Response('Response for /test/string number 2');
      await cacheWrapper.put('TODO-CHANGE-ME', putRequest, putResponseUpdate, [
        firstPlugin,
        {
          // Should work without require functions
        },
        secondPlugin,
      ]);

      [spyOne, spyTwo].forEach((pluginSpy) => {
        expect(pluginSpy.callCount).to.equal(1);
        expect(pluginSpy.args[0][0]).to.deep.equal({
          cacheName: 'TODO-CHANGE-ME',
          request: putRequest,
          oldResponse: putResponse,
          newResponse: putResponseUpdate,
        });
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
      await cacheWrapper.put('TODO-CHANGE-ME', putRequest, putResponse, [
        firstPlugin,
        {
          // Should work without require functions
        },
        secondPlugin,
      ]);

      expect(spyOne.callCount).to.equal(1);
      expect(spyOne.args[0][0]).to.deep.equal({
        request: putRequest,
        response: putResponse,
      });
      expect(spyTwo.callCount).to.equal(1);
      expect(spyTwo.args[0][0]).to.deep.equal({
        request: putRequest,
        response: firstPluginResponse,
      });
    });
  });
});
