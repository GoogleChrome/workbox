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
  const EXPECTED_RESPONSE_BODY = 'test body';

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

    it(`should return false and not add a fetch listener the second time addFetchListener() is called`, function() {
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
    it(`should throw in dev when registerRoute is called with a parameter that doesn't match the expected interface`, async function() {
      if (process.env.NODE_ENV === 'production') return this.skip();

      const router = new Router();

      await expectError(
        () => router.registerRoute({}),
        'missing-a-method',
        (error) => {
          expect(error.details).to.have.property('moduleName').that.eql('workbox-routing');
          expect(error.details).to.have.property('className').that.eql('Router');
          expect(error.details).to.have.property('funcName').that.eql('registerRoute');
          expect(error.details).to.have.property('paramName').that.eql('route');
        }
      );

      await expectError(
        () => router.registerRoute({handle: HANDLER, method: METHOD}),
        'missing-a-method',
        (error) => {
          expect(error.details).to.have.property('moduleName').that.eql('workbox-routing');
          expect(error.details).to.have.property('className').that.eql('Router');
          expect(error.details).to.have.property('funcName').that.eql('registerRoute');
          expect(error.details).to.have.property('paramName').that.eql('route');
        }
      );

      await expectError(
        () => router.registerRoute({match: MATCH, method: METHOD}),
        'incorrect-type',
        (error) => {
          expect(error.details).to.have.property('moduleName').that.eql('workbox-routing');
          expect(error.details).to.have.property('className').that.eql('Router');
          expect(error.details).to.have.property('funcName').that.eql('registerRoute');
          expect(error.details).to.have.property('paramName').that.eql('route');
        }
      );

      await expectError(
        () => router.registerRoute({match: MATCH, method: METHOD, handler: {}}),
        'missing-a-method',
        (error) => {
          expect(error.details).to.have.property('moduleName').that.eql('workbox-routing');
          expect(error.details).to.have.property('className').that.eql('Router');
          expect(error.details).to.have.property('funcName').that.eql('registerRoute');
          expect(error.details).to.have.property('paramName').that.eql('route');
        }
      );

      await expectError(
        () => router.registerRoute({match: MATCH, handle: HANDLER}),
        'incorrect-type',
        (error) => {
          expect(error.details).to.have.property('moduleName').that.eql('workbox-routing');
          expect(error.details).to.have.property('className').that.eql('Router');
          expect(error.details).to.have.property('funcName').that.eql('registerRoute');
          expect(error.details).to.have.property('paramName').that.eql('route');
        }
      );
    });

    it(`should throw in dev when registerRoutes is called with a parameter that doesn't match the expected interface`, async function() {
      if (process.env.NODE_ENV === 'production') return this.skip();

      const router = new Router();

      await expectError(
        () => router.registerRoutes([{}]),
        'missing-a-method',
        (error) => {
          expect(error.details).to.have.property('moduleName').that.eql('workbox-routing');
          expect(error.details).to.have.property('className').that.eql('Router');
          expect(error.details).to.have.property('funcName').that.eql('registerRoutes');
          expect(error.details).to.have.property('paramName').that.eql('routes');
        }
      );

      await expectError(
        () => router.registerRoutes([{handle: HANDLER, method: METHOD}]),
        'missing-a-method',
        (error) => {
          expect(error.details).to.have.property('moduleName').that.eql('workbox-routing');
          expect(error.details).to.have.property('className').that.eql('Router');
          expect(error.details).to.have.property('funcName').that.eql('registerRoutes');
          expect(error.details).to.have.property('paramName').that.eql('routes');
        }
      );

      await expectError(
        () => router.registerRoutes([{match: MATCH, method: METHOD}]),
        'incorrect-type',
        (error) => {
          expect(error.details).to.have.property('moduleName').that.eql('workbox-routing');
          expect(error.details).to.have.property('className').that.eql('Router');
          expect(error.details).to.have.property('funcName').that.eql('registerRoutes');
          expect(error.details).to.have.property('paramName').that.eql('routes');
        }
      );

      await expectError(
        () => router.registerRoutes([{match: MATCH, method: METHOD, handler: {}}]),
        'missing-a-method',
        (error) => {
          expect(error.details).to.have.property('moduleName').that.eql('workbox-routing');
          expect(error.details).to.have.property('className').that.eql('Router');
          expect(error.details).to.have.property('funcName').that.eql('registerRoutes');
          expect(error.details).to.have.property('paramName').that.eql('routes');
        }
      );

      await expectError(
        () => router.registerRoutes([{match: MATCH, handle: HANDLER}]),
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
      // We support passing in Objects that match the expected interface in addition to Routes.
      const postRoute = {
        match: MATCH,
        handler: {handle: HANDLER},
        method: 'POST',
      };

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

  describe(`setting default and catch handlers`, function() {
    it(`should update the expected internal state when setDefaultHandler() is called`, function() {
      const router = new Router();
      router.setDefaultHandler(HANDLER);

      expect(router.defaultHandler).to.eql({handle: HANDLER});
    });

    it(`should update the expected internal state when setCatchHandler() is called`, function() {
      const router = new Router();
      router.setCatchHandler(HANDLER);

      expect(router.catchHandler).to.deep.eql({handle: HANDLER});
    });
  });

  describe(`handling requests`, function() {
    it(`should return a response from the Route's handler when there's a matching route`, async function() {
      const router = new Router();
      const route = new Route(
        () => true,
        () => new Response(EXPECTED_RESPONSE_BODY),
      );
      router.registerRoute(route);

      // route.match() always returns true, so the Request details don't matter.
      const event = new FetchEvent('fetch', {request: new Request(self.location)});
      const response = await router.handleRequest(event);
      const responseBody = await response.text();

      expect(responseBody).to.eql(EXPECTED_RESPONSE_BODY);
    });

    it(`should return a response from the default handler when there's no matching route`, async function() {
      const router = new Router();
      const route = new Route(
        () => false,
        () => new Response(),
      );
      router.registerRoute(route);
      router.setDefaultHandler(() => new Response(EXPECTED_RESPONSE_BODY));

      // route.match() always returns false, so the Request details don't matter.
      const event = new FetchEvent('fetch', {request: new Request(self.location)});
      const response = await router.handleRequest(event);
      const responseBody = await response.text();

      expect(responseBody).to.eql(EXPECTED_RESPONSE_BODY);
    });

    it(`should return a response from the catch handler when the matching route's handler rejects`, async function() {
      const router = new Router();
      const route = new Route(
        () => true,
        () => Promise.reject(),
      );
      router.registerRoute(route);
      router.setCatchHandler(() => new Response(EXPECTED_RESPONSE_BODY));

      // route.match() always returns false, so the Request details don't matter.
      const event = new FetchEvent('fetch', {request: new Request(self.location)});
      const response = await router.handleRequest(event);
      const responseBody = await response.text();

      expect(responseBody).to.eql(EXPECTED_RESPONSE_BODY);
    });

    it(`should not return a response when there's no matching route and no default handler`, async function() {
      const router = new Router();
      const route = new Route(
        () => false,
        () => new Response(),
      );
      router.registerRoute(route);

      // route.match() always returns false, so the Request details don't matter.
      const event = new FetchEvent('fetch', {request: new Request(self.location)});
      const response = await router.handleRequest(event);

      expect(response).not.to.exist;
    });
  });
});
