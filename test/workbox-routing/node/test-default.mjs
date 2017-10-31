import sinon from 'sinon';
import {expect} from 'chai';
import expectError from '../../../infra/testing/expectError';
import defaultRouter from '../../../packages/workbox-routing/_default.mjs';
import {RegExpRoute} from '../../../packages/workbox-routing/RegExpRoute.mjs';
import {Route} from '../../../packages/workbox-routing/Route.mjs';

describe(`[workbox-routing] Default Router`, function() {
  const sandbox = sinon.sandbox.create();

  beforeEach(function() {
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
  });

  describe(`registerRoute()`, function() {
    it(`should handle a regex for input and return a route that can be unregistered.`, async function() {
      const handlerSpy = sandbox.spy();

      const route = defaultRouter.registerRoute(/.*/, handlerSpy);
      expect(route).to.be.an.instanceof(RegExpRoute);

      const event = new FetchEvent('fetch', {
        request: new Request(
          new URL('/', self.location).toString()
        ),
      });
      await defaultRouter.handleRequest(event);

      expect(handlerSpy.callCount).to.equal(1);
      expect(handlerSpy.getCall(0).args[0].event).to.equal(event);

      sandbox.reset();

      defaultRouter.unregisterRoute(route);
      await defaultRouter.handleRequest(event);
      expect(handlerSpy.callCount).to.equal(0);
    });

    it(`should handle a function for input and return a route that can be unregistered.`, async function() {
      const captureSpy = sandbox.stub().callsFake(() => true);
      const handlerSpy = sandbox.spy();

      const route = defaultRouter.registerRoute(captureSpy, handlerSpy);
      expect(route).to.be.an.instanceof(Route);

      const event = new FetchEvent('fetch', {
        request: new Request(
          new URL('/', self.location).toString()
        ),
      });
      await defaultRouter.handleRequest(event);

      expect(captureSpy.callCount).to.equal(1);
      expect(handlerSpy.callCount).to.equal(1);
      expect(handlerSpy.getCall(0).args[0].event).to.equal(event);

      sandbox.reset();

      defaultRouter.unregisterRoute(route);
      await defaultRouter.handleRequest(event);
      expect(captureSpy.callCount).to.equal(0);
      expect(handlerSpy.callCount).to.equal(0);
    });

    it(`should throw on unexpected capture`, function() {
      return expectError(() => {
        defaultRouter.registerRoute([], () => {});
      }, 'unsupported-route-type');
    });

    it(`should allow registering a normal Route`, async function() {
      const captureSpy = sandbox.stub().callsFake(() => true);
      const handlerSpy = sandbox.spy();

      const inputRoute = new Route(captureSpy, handlerSpy);
      const outputRoute = defaultRouter.registerRoute(inputRoute);
      expect(outputRoute).to.equal(inputRoute);

      const event = new FetchEvent('fetch', {
        request: new Request(
          new URL('/', self.location).toString()
        ),
      });
      await defaultRouter.handleRequest(event);

      expect(captureSpy.callCount).to.equal(1);
      expect(handlerSpy.callCount).to.equal(1);
      expect(handlerSpy.getCall(0).args[0].event).to.equal(event);

      sandbox.reset();

      defaultRouter.unregisterRoute(outputRoute);
      await defaultRouter.handleRequest(event);
      expect(captureSpy.callCount).to.equal(0);
      expect(handlerSpy.callCount).to.equal(0);
    });

    it(`should allow registering a class that extends Route`, async function() {
      const handlerSpy = sandbox.spy();

      const inputRoute = new RegExpRoute(/.*/, handlerSpy);
      const outputRoute = defaultRouter.registerRoute(inputRoute);
      expect(outputRoute).to.equal(inputRoute);

      const event = new FetchEvent('fetch', {
        request: new Request(
          new URL('/', self.location).toString()
        ),
      });
      await defaultRouter.handleRequest(event);

      expect(handlerSpy.callCount).to.equal(1);
      expect(handlerSpy.getCall(0).args[0].event).to.equal(event);

      sandbox.reset();

      defaultRouter.unregisterRoute(outputRoute);
      await defaultRouter.handleRequest(event);
      expect(handlerSpy.callCount).to.equal(0);
    });
  });
});
