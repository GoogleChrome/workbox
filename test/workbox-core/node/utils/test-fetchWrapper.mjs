import {expect} from 'chai';
import sinon from 'sinon';
import makeServiceWorkerEnv from 'service-worker-mock';

import expectError from '../../../../infra/utils/expectError';
import fetchWrapper from '../../../../packages/workbox-core/utils/fetchWrapper.mjs';
import '../../../mocks/mock-fetch';

describe(`workbox-core fetchWrapper`, function() {
  let sandbox;

  before(function() {
    sandbox = sinon.sandbox.create();

    const swEnv = makeServiceWorkerEnv();

    // This is needed to ensure new URL('/', location), works.
    swEnv.location = 'https://fetch.wrapper.com';

    Object.assign(global, swEnv);
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe(`.fetch()`, function() {
    // TODO Add Error Case Tests (I.e. bad input)

    it(`should work with string`, async function() {
      const stub = sandbox.stub(global, 'fetch');

      await fetchWrapper.fetch('/test/string');

      expect(stub.callCount).to.equal(1);
      const fetchRequest = stub.args[0][0];
      expect(fetchRequest.url).to.equal('/test/string');
    });

    it(`should work with Request`, async function() {
      const stub = sandbox.stub(global, 'fetch');

      await fetchWrapper.fetch(new Request('/test/request'));

      expect(stub.callCount).to.equal(1);
      const fetchRequest = stub.args[0][0];
      expect(fetchRequest.url).to.equal('/test/request');
    });

    it(`should use fetchOptions`, async function() {
      const stub = sandbox.stub(global, 'fetch');

      const exampleOptions = {
        method: 'Post',
        headers: {
          'Custom': 'Header',
        },
        body: 'Example Body'
      };
      await fetchWrapper.fetch('/test/fetchOptions', exampleOptions);

      expect(stub.callCount).to.equal(1);
      const fetchRequest = stub.args[0][0];
      expect(fetchRequest.url).to.equal('/test/fetchOptions');
      const fetchOptions = stub.args[0][1];
      expect(fetchOptions).to.deep.equal(exampleOptions);
    });

    it(`should call requestWillFetch method in plugins and use the returned request`, async function() {
      const fetchStub = sandbox.stub(global, 'fetch');
      const firstPlugin = {
        requestWillFetch: (request) => {
          return new Request('/test/requestWillFetch/1');
        },
      };

      const secondPlugin = {
        requestWillFetch: (request) => {
          return new Request('/test/requestWillFetch/2');
        },
      };

      const spyOne = sandbox.spy(firstPlugin, 'requestWillFetch');
      const spyTwo = sandbox.spy(secondPlugin, 'requestWillFetch');

      await fetchWrapper.fetch('/test/requestWillFetch/0', null, [
        firstPlugin,
        {
          // It should be able to handle plugins without the required method.
        },
        secondPlugin,
      ]);

      expect(spyOne.callCount).equal(1);
      expect(spyTwo.callCount).equal(1);
      expect(fetchStub.callCount).to.equal(1);

      const fetchRequest = fetchStub.args[0][0];
      expect(fetchRequest.url).to.equal('/test/requestWillFetch/2');
    });

    it(`should throw a meaningful error on bad requestWillFetch plugin`, async function() {
      const fetchStub = sandbox.stub(global, 'fetch');
      const errorPlugin = {
        requestWillFetch: (request) => {
          throw new Error('Injected Error from Test.');
        },
      };
      const errorPluginSpy = sandbox.spy(errorPlugin, 'requestWillFetch');

      await expectError(() => {
        return fetchWrapper.fetch('/test/requestWillFetch/0', null, [
          errorPlugin,
        ]);
      }, 'plugin-error-request-will-fetch', (err) => {
        expect(err.details.thrownError).to.exist;
        expect(err.details.thrownError.message).to.equal('Injected Error from Test.');
      });

      expect(errorPluginSpy.callCount).equal(1);
      expect(fetchStub.callCount).to.equal(0);
    });

    it(`should call fetchDidFail method in plugins`, async function() {
      const fetchStub = sandbox.stub(global, 'fetch');
      fetchStub.callsFake(() => {
        return Promise.reject(new Error('Injected Error.'));
      });

      const secondPlugin = {
        fetchDidFail: ({originalRequest, request}) => {
          expect(originalRequest.url).to.equal('/test/failingRequest/0');
          expect(request.url).to.equal('/test/failingRequest/1');
        },
      };
      const spyTwo = sandbox.spy(secondPlugin, 'fetchDidFail');

      const firstPlugin = {
        requestWillFetch: ({request}) => {
          return new Request('/test/failingRequest/1');
        },
        fetchDidFail: ({originalRequest, request}) => {
          // This should be called first
          expect(spyTwo.callCount).to.equal(0);
          expect(originalRequest.url).to.equal('/test/failingRequest/0');
          expect(request.url).to.equal('/test/failingRequest/1');
        },
      };
      const spyOne = sandbox.spy(firstPlugin, 'fetchDidFail');

      try {
        await fetchWrapper.fetch('/test/failingRequest/0', null, [
          firstPlugin,
          {
            // It should be able to handle plugins without the required method.
          },
          secondPlugin,
        ]);
        throw new Error('No error thrown when it was expected.');
      } catch (err) {
        expect(err.message).to.equal('Injected Error.');
      }

      expect(spyOne.callCount).equal(1);
      expect(spyTwo.callCount).equal(1);
      expect(fetchStub.callCount).to.equal(1);

      const fetchRequest = fetchStub.args[0][0];
      expect(fetchRequest.url).to.equal('/test/failingRequest/1');
    });
  });
});
