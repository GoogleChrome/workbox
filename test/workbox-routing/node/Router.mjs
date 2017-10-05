import clearRequire from 'clear-require';
import sinon from 'sinon';
import {expect} from 'chai';

import Route from '../../../packages/workbox-routing/lib/Route.mjs';
import Router from '../../../packages/workbox-routing/lib/Router.mjs';
import expectError from '../../../infra/utils/expectError';
import {_private} from '../../../packages/workbox-core/index.mjs';

describe(`[workbox-routing] Router`, function() {
  const sandbox = sinon.sandbox.create();
  const {logger} = _private;
  const MATCH = () => {};
  const HANDLER = () => {};
  const METHOD = 'POST';

  beforeEach(async function() {
    clearRequire.all();

    // Run this in the `beforeEach` hook as well as the afterEach hook due to
    // a mocha bug where `afterEach` hooks aren't run for skipped tests.
    // https://github.com/mochajs/mocha/issues/2546
    sandbox.restore();
    // Prevent logs in the mocha output.
    sandbox.stub(logger, 'warn');
    sandbox.stub(logger, 'log');
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe(`constructor`, function() {
    it(`should construct without any inputs`, function() {
      expect(() => {
        new Router();
      }).to.not.throw();
    });
  });

  describe(`calling addFetchListener()`, function() {
    it(`should return true and add a fetch listener the first time addFetchListener() is called`, function() {
      const spy = sandbox.spy(self, 'addEventListener');

      const router = new Router();
      const added = router.addFetchListener();

      expect(added).to.be.true;
      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0]).to.eql('fetch');
      expect(spy.firstCall.args[1]).to.be.a('function');
    });

    it(`should return false and not a fetch listener the second time addFetchListener() is called`, function() {
      const spy = sandbox.spy(self, 'addEventListener');

      const router = new Router();
      const addedFirst = router.addFetchListener();
      const addedSecond = router.addFetchListener();

      expect(addedFirst).to.be.true;
      expect(addedSecond).to.be.false;
      expect(spy.calledOnce).to.be.true;
    });
  });

  describe(`registering and unregistering routes`, function() {
    it(`should throw in dev when register is called with objects that don't match the expected interface`, async function() {
      if (process.env.NODE_ENV === 'production') return this.skip();

      const router = new Router();

      await expectError(
        () => router.registerRoute({}),
        'missing-a-method',
        (error) => {
          expect(error.details).to.have.property('moduleName').that.eql('workbox-routing');
          expect(error.details).to.have.property('className').that.eql('Router');
          expect(error.details).to.have.property('funcName').that.eql('registerRoutes');
          expect(error.details).to.have.property('paramName').that.eql('routes');
        }
      );

      await expectError(
        () => router.registerRoute({handle: HANDLER, method: METHOD}),
        'missing-a-method',
        (error) => {
          expect(error.details).to.have.property('moduleName').that.eql('workbox-routing');
          expect(error.details).to.have.property('className').that.eql('Router');
          expect(error.details).to.have.property('funcName').that.eql('registerRoutes');
          expect(error.details).to.have.property('paramName').that.eql('routes');
        }
      );

      await expectError(
        () => router.registerRoute({match: MATCH, method: METHOD}),
        'missing-a-method',
        (error) => {
          expect(error.details).to.have.property('moduleName').that.eql('workbox-routing');
          expect(error.details).to.have.property('className').that.eql('Router');
          expect(error.details).to.have.property('funcName').that.eql('registerRoutes');
          expect(error.details).to.have.property('paramName').that.eql('routes');
        }
      );


      await expectError(
        () => router.registerRoute({match: MATCH, handle: HANDLER}),
        'incorrect-type',
        (error) => {
          expect(error.details).to.have.property('moduleName').that.eql('workbox-routing');
          expect(error.details).to.have.property('className').that.eql('Router');
          expect(error.details).to.have.property('funcName').that.eql('registerRoutes');
          expect(error.details).to.have.property('paramName').that.eql('routes');
        }
      );
    });

    it(`should modify the internal arrays of routes when register/unregister is called`, function() {
      const router = new Router();

      // Routes without an explicit method will default to GET.
      const getRoute1 = new Route(MATCH, HANDLER);
      const getRoute2 = new Route(MATCH, HANDLER, 'GET');
      const putRoute1 = new Route(MATCH, HANDLER, 'PUT');
      const putRoute2 = new Route(MATCH, HANDLER, 'PUT');
      // We support passing in objects that match the expected interface.
      const postRoute = {match: MATCH, handle: HANDLER, method: 'POST'};

      router.registerRoute(getRoute1);
      router.registerRoutes([getRoute2, putRoute1, putRoute2, postRoute]);

      expect(router._routes.get('GET')).to.have.members([getRoute1, getRoute2]);
      expect(router._routes.get('PUT')).to.have.members([putRoute1, putRoute2]);

      router.unregisterRoutes([getRoute2]);
      router.unregisterRoute(putRoute2);

      expect(router._routes.get('GET')).to.have.members([getRoute1]);
      expect(router._routes.get('PUT')).to.have.members([putRoute1]);
    });
  });
});
