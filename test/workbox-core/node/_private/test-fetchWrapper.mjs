import {expect} from 'chai';
import sinon from 'sinon';

import expectError from '../../../../infra/testing/expectError';

import {fetchWrapper} from '../../../../packages/workbox-core/_private/fetchWrapper.mjs';

describe(`workbox-core fetchWrapper`, function() {
  let sandbox;

  before(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe(`.fetch()`, function() {
    // TODO Add Error Case Tests (I.e. bad input)

    it(`should work with request string`, async function() {
      const stub = sandbox.stub(global, 'fetch').callsFake(() => new Response());

      await fetchWrapper.fetch({request: '/test/string'});

      expect(stub.callCount).to.equal(1);
      const fetchRequest = stub.args[0][0];
      expect(fetchRequest.url).to.equal('/test/string');
    });

    it(`should work with Request instance`, async function() {
      const stub = sandbox.stub(global, 'fetch').callsFake(() => new Response());

      await fetchWrapper.fetch({request: new Request('/test/request')});

      expect(stub.callCount).to.equal(1);
      const fetchRequest = stub.args[0][0];
      expect(fetchRequest.url).to.equal('/test/request');
    });

    it(`should use fetchOptions`, async function() {
      const stub = sandbox.stub(global, 'fetch').callsFake(() => new Response());

      const exampleOptions = {
        method: 'Post',
        headers: {
          'Custom': 'Header',
        },
        body: 'Example Body',
      };
      await fetchWrapper.fetch({
        request: '/test/fetchOptions',
        fetchOptions: exampleOptions,
      });

      expect(stub.callCount).to.equal(1);
      const fetchRequest = stub.args[0][0];
      expect(fetchRequest.url).to.equal('/test/fetchOptions');
      const fetchOptions = stub.args[0][1];
      expect(fetchOptions).to.deep.equal(exampleOptions);
    });

    it(`should call requestWillFetch method in plugins and use the returned request`, async function() {
      const fetchStub = sandbox.stub(global, 'fetch').callsFake(() => new Response());

      const stub1 = sandbox.stub().returns(new Request('/test/requestWillFetch/1'));
      const stub2 = sandbox.stub().returns(new Request('/test/requestWillFetch/2'));

      const firstPlugin = {requestWillFetch: stub1};
      const secondPlugin = {requestWillFetch: stub2};

      const request = new Request('/test/requestWillFetch/0');
      const event = new FetchEvent('fetch', {request});

      await fetchWrapper.fetch({
        request,
        event,
        plugins: [
          firstPlugin,
          {
            // It should be able to handle plugins without the required method.
          },
          secondPlugin,
        ],
      });

      expect(stub1.callCount).equal(1);
      expect(stub1.args[0][0].request.url).to.equal(request.url);
      expect(stub1.args[0][0].event).to.equal(event);
      expect(stub2.callCount).equal(1);
      expect(stub2.args[0][0].request.url).to.equal(stub1.returnValues[0].url);
      expect(stub2.args[0][0].event).to.equal(event);

      expect(fetchStub.callCount).to.equal(1);

      const fetchRequest = fetchStub.args[0][0];
      expect(fetchRequest.url).to.equal('/test/requestWillFetch/2');
    });

    it(`should throw a meaningful error on bad requestWillFetch plugin`, async function() {
      const fetchStub = sandbox.stub(global, 'fetch').callsFake(() => new Response());
      const errorPlugin = {
        requestWillFetch: (request) => {
          throw new Error('Injected Error from Test.');
        },
      };
      const errorPluginSpy = sandbox.spy(errorPlugin, 'requestWillFetch');

      await expectError(() => {
        return fetchWrapper.fetch({
          request: '/test/requestWillFetch/0',
          plugins: [errorPlugin],
        });
      }, 'plugin-error-request-will-fetch', (err) => {
        expect(err.details.thrownError).to.exist;
        expect(err.details.thrownError.message).to.equal('Injected Error from Test.');
      });

      expect(errorPluginSpy.callCount).equal(1);
      expect(fetchStub.callCount).to.equal(0);
    });

    it(`should call fetchDidFail method in plugins`, async function() {
      sandbox.stub(global, 'fetch').callsFake(() => {
        return Promise.reject(new Error('Injected Error.'));
      });

      const secondPlugin = {
        fetchDidFail: sandbox.stub().callsFake(({originalRequest, request, event, error}) => {
          expect(originalRequest.url).to.equal('/test/failingRequest/0');
          expect(request.url).to.equal('/test/failingRequest/1');
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
          expect(originalRequest.url).to.equal('/test/failingRequest/0');
          expect(request.url).to.equal('/test/failingRequest/1');
          expect(error.message).to.equal('Injected Error.');
        }),
      };

      try {
        await fetchWrapper.fetch({
          request: '/test/failingRequest/0',
          plugins: [
            firstPlugin,
            {
              // It should be able to handle plugins without the required method.
            },
            secondPlugin,
          ],
        });
        throw new Error('No error thrown when it was expected.');
      } catch (err) {
        expect(err.message).to.equal('Injected Error.');
      }

      expect(firstPlugin.fetchDidFail.callCount).equal(1);
      expect(secondPlugin.fetchDidFail.callCount).equal(1);
      expect(global.fetch.callCount).to.equal(1);

      const fetchRequest = global.fetch.args[0][0];
      expect(fetchRequest.url).to.equal('/test/failingRequest/1');
    });
  });
});
