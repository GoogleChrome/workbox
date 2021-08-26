/*
  Copyright 2020 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {timeout} from 'workbox-core/_private/timeout.mjs';
import {Strategy} from 'workbox-strategies/Strategy.mjs';
import {spyOnEvent} from '../../../infra/testing/helpers/extendable-event-utils.mjs';

class FetchStrategy extends Strategy {
  _handle(request, handler) {
    return handler.fetch(request);
  }
}

class LongWaitUntilStrategy extends Strategy {
  _handle(request, handler) {
    handler.waitUntil(timeout(200));
    return new Response('generated response');
  }
}

class EmptyStrategy extends Strategy {
  _handle(request, handler) {
    return new Response('generated response');
  }
}

class ErrorStrategy extends Strategy {
  _handle(request, handler) {
    handler.waitUntil(Promise.reject(new Error('waitUntil error')));
    return new Response('generated response');
  }
}

class HandlerThrowsStrategy extends Strategy {
  constructor(options) {
    super(options);
    this._error = options.error;
  }
  async _handle(request, handler) {
    throw this._error;
  }
}

class HandlerReturnsUndefinedStrategy extends Strategy {
  async _handle(request, handler) {
    return undefined;
  }
}

class HandlerReturnsResponseErrorStrategy extends Strategy {
  async _handle(request, handler) {
    return Response.error();
  }
}

class ExtendingStrategy extends FetchStrategy {
  constructor(options) {
    super(options);
    this._newProperty = options.newProperty;
  }
  async _handle(request, handler) {
    handler.waitUntil(timeout(100));
    return (
      (await handler.cacheMatch(request)) ||
      (await super._handle(request, handler))
    );
  }
}

function generateOptions() {
  const request = new Request('/strategy-request');
  const event = new FetchEvent('fetch', {request});
  spyOnEvent(event);

  return {request, event};
}

describe(`Strategy`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(async function () {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    sandbox.restore();
  });

  afterEach(async function () {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    sandbox.restore();
  });

  describe('constructor()', function () {
    it('works when extended but not overridden', function () {
      const options = {
        cacheName: 'test-cache',
        fetchOptions: {credentials: 'include'},
        matchOptions: {ignoreSearch: true},
        plugins: [
          {
            handlerWillStart() {},
          },
        ],
      };

      const strategy = new FetchStrategy(options);

      expect(strategy.cacheName).to.equal(options.cacheName);
      expect(strategy.fetchOptions).to.equal(options.fetchOptions);
      expect(strategy.matchOptions).to.equal(options.matchOptions);
      expect(strategy.plugins).to.equal(options.plugins);
    });

    it('works when extended and overridden', function () {
      const options = {
        cacheName: 'test-cache',
        fetchOptions: {credentials: 'include'},
        matchOptions: {ignoreSearch: true},
        plugins: [
          {
            handlerWillStart() {},
          },
        ],
        newProperty: 'I am new!',
      };

      const strategy = new ExtendingStrategy(options);

      expect(strategy.cacheName).to.equal(options.cacheName);
      expect(strategy.fetchOptions).to.equal(options.fetchOptions);
      expect(strategy.matchOptions).to.equal(options.matchOptions);
      expect(strategy.plugins).to.equal(options.plugins);

      expect(strategy._newProperty).to.equal(options.newProperty);
    });
  });

  describe('.handleAll()', function () {
    it('runs the strategy and returns a response and done promise tuple', async function () {
      const strategy = new LongWaitUntilStrategy();
      const {request, event} = generateOptions();

      const startTime = performance.now();
      const [responsePromise, donePromise] = strategy.handleAll({
        request,
        event,
      });

      const response = await responsePromise;
      expect(performance.now() - startTime < 200).to.be.true;
      expect(await response.text()).to.equal('generated response');

      await donePromise;
      expect(performance.now() - startTime >= 200).to.be.true;
    });

    it('accepts a string as the request param', async function () {
      sandbox.stub(self, 'fetch').resolves(new Response('fetch response'));

      const strategy = new FetchStrategy();
      const {event} = generateOptions();

      const [responsePromise] = strategy.handleAll({
        request: '/string-url',
        event,
      });
      await responsePromise;

      expect(self.fetch.firstCall.args[0].url).to.equal(
        location.origin + '/string-url',
      );
    });

    it('accepts a Request as the request param', async function () {
      sandbox.stub(self, 'fetch').resolves(new Response('fetch response'));

      const strategy = new FetchStrategy();
      const {request, event} = generateOptions();

      const [responsePromise] = strategy.handleAll({request, event});
      await responsePromise;

      expect(self.fetch.firstCall.args[0]).to.equal(request);
    });

    it(`runs all handlerWillStart callbacks`, async function () {
      const plugins = [
        {handlerWillStart: sandbox.spy()},
        {nonMatchingCallback: sandbox.spy()},
        {
          /* Empty plugin */
        },
        {handlerWillStart: sandbox.spy()},
      ];
      const strategy = new EmptyStrategy({plugins});
      const {request, event} = generateOptions();

      await Promise.all(strategy.handleAll({request, event}));

      expect(
        plugins[0].handlerWillStart.calledOnceWith(
          sinon.match({
            request,
            event,
            state: sinon.match(Object),
          }),
        ),
      ).to.be.true;

      expect(plugins[1].nonMatchingCallback.callCount).to.equal(0);

      expect(
        plugins[3].handlerWillStart.calledOnceWith(
          sinon.match({
            request,
            event,
            state: sinon.match(Object),
          }),
        ),
      ).to.be.true;
    });

    it(`runs all handlerWillRespond callbacks with the response`, async function () {
      const plugins = [
        {
          handlerWillRespond: sandbox
            .stub()
            .callsFake(({response}) => response),
        },
        {nonMatchingCallback: sandbox.spy()},
        {
          /* Empty plugin */
        },
        {
          handlerWillRespond: sandbox
            .stub()
            .callsFake(({response}) => response),
        },
      ];
      const strategy = new EmptyStrategy({plugins});
      const {request, event} = generateOptions();

      const [response] = await Promise.all(
        strategy.handleAll({request, event}),
      );

      expect(
        plugins[0].handlerWillRespond.calledOnceWith(
          sinon.match({
            request,
            event,
            state: sinon.match(Object),
          }),
        ),
      ).to.be.true;
      expect(
        await plugins[0].handlerWillRespond.firstCall.args[0].response
          .clone()
          .text(),
      ).to.equal('generated response');
      expect(
        await plugins[0].handlerWillRespond.firstCall.returnValue
          .clone()
          .text(),
      ).to.equal('generated response');

      expect(plugins[1].nonMatchingCallback.callCount).to.equal(0);

      expect(
        plugins[3].handlerWillRespond.calledOnceWith(
          sinon.match({
            request,
            event,
            state: sinon.match(Object),
          }),
        ),
      ).to.be.true;
      expect(
        await plugins[3].handlerWillRespond.firstCall.args[0].response
          .clone()
          .text(),
      ).to.equal('generated response');
      expect(
        await plugins[3].handlerWillRespond.firstCall.returnValue
          .clone()
          .text(),
      ).to.equal('generated response');

      expect(await response.clone().text()).to.equal('generated response');
    });

    it(`runs all handlerDidRespond callbacks with the response`, async function () {
      const plugins = [
        {handlerDidRespond: sandbox.spy()},
        {nonMatchingCallback: sandbox.spy()},
        {
          /* Empty plugin */
        },
        {handlerDidRespond: sandbox.spy()},
      ];
      const strategy = new EmptyStrategy({plugins});
      const {request, event} = generateOptions();

      const [response] = await Promise.all(
        strategy.handleAll({request, event}),
      );

      expect(
        plugins[0].handlerDidRespond.calledOnceWith(
          sinon.match({
            request,
            event,
            state: sinon.match(Object),
          }),
        ),
      ).to.be.true;
      expect(
        await plugins[0].handlerDidRespond.firstCall.args[0].response
          .clone()
          .text(),
      ).to.equal('generated response');

      expect(plugins[1].nonMatchingCallback.callCount).to.equal(0);

      expect(
        plugins[3].handlerDidRespond.calledOnceWith(
          sinon.match({
            request,
            event,
            state: sinon.match(Object),
          }),
        ),
      ).to.be.true;
      expect(
        await plugins[3].handlerDidRespond.firstCall.args[0].response
          .clone()
          .text(),
      ).to.equal('generated response');

      expect(await response.clone().text()).to.equal('generated response');
    });

    it(`runs all handlerDidComplete callbacks`, async function () {
      const plugins = [
        {handlerDidComplete: sandbox.spy()},
        {nonMatchingCallback: sandbox.spy()},
        {
          /* Empty plugin */
        },
        {handlerDidComplete: sandbox.spy()},
      ];
      const strategy = new EmptyStrategy({plugins});
      const {request, event} = generateOptions();

      await Promise.all(strategy.handleAll({request, event}));

      expect(
        plugins[0].handlerDidComplete.calledOnceWith(
          sinon.match({
            request,
            event,
            state: sinon.match(Object),
          }),
        ),
      ).to.be.true;
      expect(
        await plugins[0].handlerDidComplete.firstCall.args[0].response
          .clone()
          .text(),
      ).to.equal('generated response');

      expect(plugins[1].nonMatchingCallback.callCount).to.equal(0);

      expect(
        plugins[3].handlerDidComplete.calledOnceWith(
          sinon.match({
            request,
            event,
            state: sinon.match(Object),
          }),
        ),
      ).to.be.true;
      expect(
        await plugins[3].handlerDidComplete.firstCall.args[0].response
          .clone()
          .text(),
      ).to.equal('generated response');
    });

    it('passes any errors in waitUntil promises to the handlerDidComplete callback', async function () {
      const plugins = [{handlerDidComplete: sinon.spy()}];
      const strategy = new ErrorStrategy({plugins});

      const {request, event} = generateOptions();

      let doneError;
      try {
        const [, done] = strategy.handleAll({request, event});
        await done;
      } catch (error) {
        doneError = error;
      }

      expect(
        plugins[0].handlerDidComplete.calledOnceWith(
          sinon.match({
            request,
            event,
            error: doneError,
            state: sinon.match(Object),
          }),
        ),
      ).to.be.true;
      expect(
        await plugins[0].handlerDidComplete.firstCall.args[0].response
          .clone()
          .text(),
      ).to.equal('generated response');
    });
  });

  describe('handlerDidError', function () {
    it('should use the first callback that returns a Response when _handler() throws', async function () {
      const plugins = [
        {
          handlerDidError: sandbox.stub().resolves(undefined),
        },
        {
          handlerDidError: sandbox.stub().resolves(new Response('from plugin')),
        },
        {
          handlerDidError: sandbox.stub().resolves(undefined),
        },
      ];
      const error = new Error('thrown error');
      const strategy = new HandlerThrowsStrategy({error, plugins});

      const {request, event} = generateOptions();

      const [responsePromise] = strategy.handleAll({request, event});
      const response = await responsePromise;
      const responseBody = await response.text();
      const expectedArgs = [
        [
          {
            error,
            event,
            request,
            state: {},
          },
        ],
      ];

      expect(responseBody).to.eql('from plugin');
      expect(plugins[0].handlerDidError.args).to.eql(expectedArgs);
      expect(plugins[1].handlerDidError.args).to.eql(expectedArgs);
      // This shouldn't run, since the previous plugin returns a response.
      expect(plugins[2].handlerDidError.args).to.eql([]);
    });

    it(`should rethrow the error when the callbacks don't return a Response`, async function () {
      const plugins = [
        {
          handlerDidError: sandbox.stub().resolves(undefined),
        },
        {
          handlerDidError: sandbox.stub().resolves(undefined),
        },
      ];
      const error = new Error('thrown error');
      const strategy = new HandlerThrowsStrategy({error, plugins});

      const {request, event} = generateOptions();

      const [responsePromise] = strategy.handleAll({request, event});
      try {
        await responsePromise;
        throw new Error('unexpected error');
      } catch (thrownError) {
        expect(thrownError).to.eql(error);

        const expectedArgs = [
          [
            {
              error,
              event,
              request,
              state: {},
            },
          ],
        ];

        expect(plugins[0].handlerDidError.args).to.eql(expectedArgs);
        expect(plugins[1].handlerDidError.args).to.eql(expectedArgs);
      }
    });

    it('should use the callback Response when _handler() returns undefined', async function () {
      const plugins = [
        {
          handlerDidError: sandbox.stub().resolves(new Response('from plugin')),
        },
      ];
      const strategy = new HandlerReturnsUndefinedStrategy({plugins});

      const {request, event} = generateOptions();

      const [responsePromise] = strategy.handleAll({request, event});
      const response = await responsePromise;
      const responseBody = await response.text();

      expect(responseBody).to.eql('from plugin');

      // We can't do a deep equality check without a reference to the
      // WorkboxError, so just do a sanity check.
      expect(plugins[0].handlerDidError.args[0][0].error.name).to.eql(
        'no-response',
      );
    });

    it('should throw an error when _handler() returns undefined and the callbacks return undefined', async function () {
      const plugins = [
        {
          handlerDidError: sandbox.stub().resolves(undefined),
        },
      ];
      const strategy = new HandlerReturnsUndefinedStrategy({plugins});

      const {request, event} = generateOptions();

      const [responsePromise] = strategy.handleAll({request, event});
      try {
        await responsePromise;
        throw new Error('unexpected error');
      } catch (thrownError) {
        expect(thrownError.name).to.eql('no-response');

        expect(plugins[0].handlerDidError.args).to.eql([
          [
            {
              event,
              request,
              error: thrownError,
              state: {},
            },
          ],
        ]);
      }
    });

    it('should use the callback Response when _handler() returns Response.error()', async function () {
      const plugins = [
        {
          handlerDidError: sandbox.stub().resolves(new Response('from plugin')),
        },
      ];
      const strategy = new HandlerReturnsResponseErrorStrategy({plugins});

      const {request, event} = generateOptions();

      const [responsePromise] = strategy.handleAll({request, event});
      const response = await responsePromise;
      const responseBody = await response.text();

      expect(responseBody).to.eql('from plugin');

      // We can't do a deep equality check without a reference to the
      // WorkboxError, so just do a sanity check.
      expect(plugins[0].handlerDidError.args[0][0].error.name).to.eql(
        'no-response',
      );
    });
  });

  describe('handle', function () {
    it(`invokes handleAll() and returns the response promise`, async function () {
      const strategy = new EmptyStrategy();
      const {request, event} = generateOptions();

      const stubResponse = new Response('stub response');
      sandbox
        .stub(strategy, 'handleAll')
        .returns([Promise.resolve(stubResponse), Promise.resolve()]);

      const response = await strategy.handle({request, event});

      expect(response).to.equal(stubResponse);
      expect(strategy.handleAll.callCount).to.equal(1);
      expect(strategy.handleAll.calledWith({event, request})).to.be.true;
    });
  });
});
