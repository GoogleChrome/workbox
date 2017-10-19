import sinon from 'sinon';
import {expect} from 'chai';

import Route from '../../../packages/workbox-routing/Route.mjs';
import Router from '../../../packages/workbox-routing/Router.mjs';
import expectError from '../../../infra/testing/expectError';
import generateTestVariants from '../../../infra/testing/generate-variant-tests';

describe(`[workbox-routing] Router`, function() {
  const sandbox = sinon.sandbox.create();
  const MATCH = () => {};
  const HANDLER = {handle: () => {}};
  const METHOD = 'POST';
  const EXPECTED_RESPONSE_BODY = 'test body';

  beforeEach(async function() {
    // Run this in the `beforeEach` hook as well as the afterEach hook due to
    // a mocha bug where `afterEach` hooks aren't run for skipped tests.
    // https://github.com/mochajs/mocha/issues/2546
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
  });

  describe(`constructor`, function() {
    it(`should construct without any inputs`, function() {
      expect(() => {
        new Router();
      }).to.not.throw();
    });
  });

  describe(`registerRoute()`, function() {
    const invalidMatches = [{}, true, false, 123, '123', [123], null, undefined];
    generateTestVariants(`should throw in dev when route.match is not a function`, invalidMatches, async function(variant) {
      if (process.env.NODE_ENV === 'production') return this.skip();

      const router = new Router();
      await expectError(
        () => router.registerRoute({handler: HANDLER, method: METHOD, match: variant}),
        'missing-a-method',
        (error) => {
          expect(error.details).to.have.property('moduleName').that.eql('workbox-routing');
          expect(error.details).to.have.property('className').that.eql('Router');
          expect(error.details).to.have.property('funcName').that.eql('registerRoute');
          expect(error.details).to.have.property('paramName').that.eql('route');
          expect(error.details).to.have.property('expectedMethod').that.eql('match');
        });
    });

    const invalidHandlers = [() => {}, true, false, 123, '123', undefined];
    generateTestVariants(`should throw in dev when route.handler is not an object`, invalidHandlers, async function(variant) {
      if (process.env.NODE_ENV == 'production') return this.skip();

      const router = new Router();
      await expectError(
        () => router.registerRoute({match: MATCH, method: METHOD, handler: variant}),
        'incorrect-type',
        (error) => {
          expect(error.details).to.have.property('moduleName').that.eql('workbox-routing');
          expect(error.details).to.have.property('className').that.eql('Router');
          expect(error.details).to.have.property('funcName').that.eql('registerRoute');
          expect(error.details).to.have.property('paramName').that.eql('route');
          expect(error.details).to.have.property('expectedType').that.eql('object');
        }
      );
    });

    const invalidMethods = [() => {}, {}, true, false, 123, [123], null, undefined];
    generateTestVariants(`should throw in dev when route.method is not a string`, invalidMethods, async function(variant) {
      if (process.env.NODE_ENV == 'production') return this.skip();

      const router = new Router();
      await expectError(
        () => router.registerRoute({match: MATCH, handler: HANDLER, method: variant}),
        'incorrect-type',
        (error) => {
          expect(error.details).to.have.property('moduleName').that.eql('workbox-routing');
          expect(error.details).to.have.property('className').that.eql('Router');
          expect(error.details).to.have.property('funcName').that.eql('registerRoute');
          expect(error.details).to.have.property('paramName').that.eql('route.method');
          expect(error.details).to.have.property('expectedType').that.eql('string');
        }
      );
    });

    it(`should throw in dev when route.handler.handle is not a function`, async function() {
      if (process.env.NODE_ENV === 'production') return this.skip();

      const router = new Router();
      await expectError(
        () => router.registerRoute({match: MATCH, method: METHOD, handler: {}}),
        'missing-a-method',
        (error) => {
          expect(error.details).to.have.property('moduleName').that.eql('workbox-routing');
          expect(error.details).to.have.property('className').that.eql('Router');
          expect(error.details).to.have.property('funcName').that.eql('registerRoute');
          expect(error.details).to.have.property('paramName').that.eql('route.handler');
          expect(error.details).to.have.property('expectedMethod').that.eql('handle');
        }
      );
    });

    it(`should add the expected entries to the internal arrays of routes`, function() {
      const router = new Router();

      // Routes without an explicit method will default to GET.
      const getRoute1 = new Route(MATCH, HANDLER);
      const getRoute2 = new Route(MATCH, HANDLER, 'GET');
      const putRoute1 = new Route(MATCH, HANDLER, 'PUT');
      const putRoute2 = new Route(MATCH, HANDLER, 'PUT');
      // We support passing in Objects that match the expected interface in addition to Routes.
      const postRoute = {
        match: MATCH,
        handler: HANDLER,
        method: 'POST',
      };

      for (const route of [getRoute1, getRoute2, putRoute1, putRoute2, postRoute]) {
        router.registerRoute(route);
      }

      expect(router._routes.get('GET')).to.have.members([getRoute1, getRoute2]);
      expect(router._routes.get('PUT')).to.have.members([putRoute1, putRoute2]);
      expect(router._routes.get('POST')).to.have.members([postRoute]);
    });
  });

  describe(`unregisterRoute()`, function() {
    it(`should remove the expected entries from the internal arrays of routes`, function() {
      const router = new Router();

      // Routes without an explicit method will default to GET.
      const getRoute1 = new Route(MATCH, HANDLER);
      const getRoute2 = new Route(MATCH, HANDLER, 'GET');
      const putRoute1 = new Route(MATCH, HANDLER, 'PUT');
      const putRoute2 = new Route(MATCH, HANDLER, 'PUT');
      // We support passing in Objects that match the expected interface in addition to Routes.
      const postRoute = {
        match: MATCH,
        handler: HANDLER,
        method: 'POST',
      };

      for (const route of [getRoute1, getRoute2, putRoute1, putRoute2, postRoute]) {
        router.registerRoute(route);
      }

      router.unregisterRoute(getRoute2);
      router.unregisterRoute(putRoute2);

      expect(router._routes.get('GET')).to.have.members([getRoute1]);
      expect(router._routes.get('PUT')).to.have.members([putRoute1]);
      expect(router._routes.get('POST')).to.have.members([postRoute]);
    });

    it(`should throw when called with a route with a method for which there isn't an array of routes`, function() {
      const router = new Router();

      // Routes without an explicit method will default to GET.
      const getRoute = new Route(MATCH, HANDLER, 'GET');
      const putRoute = new Route(MATCH, HANDLER, 'PUT');

      router.registerRoute(getRoute);
      expectError(
        () => router.unregisterRoute(putRoute),
        'unregister-route-but-not-found-with-method',
        (error) => {
          expect(error.details).to.have.property('method').that.eql('PUT');
        }
      );
    });

    it(`should throw when called with a route that wasn't previously registered`, function() {
      const router = new Router();

      // Routes without an explicit method will default to GET.
      const getRoute1 = new Route(MATCH, HANDLER, 'GET');
      const getRoute2 = new Route(MATCH, HANDLER, 'GET');

      router.registerRoute(getRoute1);
      expectError(
        () => router.unregisterRoute(getRoute2),
        'unregister-route-route-not-registered'
      );
    });
  });

  describe(`setDefaultHandler()`, function() {
    it(`should update the expected internal state`, function() {
      const router = new Router();
      router.setDefaultHandler(HANDLER);

      expect(router._defaultHandler).to.eql(HANDLER);
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
  });

  describe(`setCatchHandler()`, function() {
    it(`should update the expected internal state`, function() {
      const router = new Router();
      router.setCatchHandler(HANDLER);

      expect(router._catchHandler).to.deep.eql(HANDLER);
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
  });

  describe(`handleRequest()`, function() {
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

    it(`should return a response from the first matching route when there are multiple potential matches`, async function() {
      const router = new Router();
      const response1 = 'response1';
      const response2 = 'response2';
      const route1 = new Route(
        () => true,
        () => new Response(response1),
      );
      router.registerRoute(route1);
      const route2 = new Route(
        () => true,
        () => new Response(response2),
      );
      router.registerRoute(route2);

      // route.match() always returns true, so the Request details don't matter.
      const event = new FetchEvent('fetch', {request: new Request(self.location)});
      const response = await router.handleRequest(event);
      const responseBody = await response.text();

      expect(responseBody).to.eql(response1);
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
      const response = router.handleRequest(event);

      expect(response).not.to.exist;
    });
  });
});
