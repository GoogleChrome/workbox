import sinon from 'sinon';
import {expect} from 'chai';

import defaultRouter from '../../../packages/workbox-routing/_default.mjs';
import expectError from '../../../infra/testing/expectError';
import {NavigationRoute} from '../../../packages/workbox-routing/NavigationRoute.mjs';
import {RegExpRoute} from '../../../packages/workbox-routing/RegExpRoute.mjs';
import {Route} from '../../../packages/workbox-routing/Route.mjs';
import {cacheNames} from '../../../packages/workbox-core/_private/cacheNames.mjs';
import {devOnly} from '../../../infra/testing/env-it';

describe(`[workbox-routing] Default Router`, function() {
  const sandbox = sinon.sandbox.create();

  beforeEach(function() {
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
  });

  describe(`registerRoute()`, function() {
    devOnly.it(`should throw when using a string that doesn't start with '/' or 'http' is used.`, async function() {
      await expectError(
        () => defaultRouter.registerRoute('invalid-start', sandbox.stub()),
        'invalid-string',
        (error) => {
          expect(error.details).to.have.property('moduleName').that.equals('workbox-routing');
          expect(error.details).to.have.property('className').that.equals('DefaultRouter');
          expect(error.details).to.have.property('funcName').that.equals('registerRoute');
          expect(error.details).to.have.property('paramName').that.equals('capture');
        }
      );
    });

    it(`should handle a string for input and return a route that can be unregistered.`, async function() {
      const handlerSpy = sandbox.spy();

      const route = defaultRouter.registerRoute('/abc', handlerSpy);
      expect(route).to.be.an.instanceof(Route);

      const event = new FetchEvent('fetch', {
        request: new Request(
          new URL('/abc', self.location).toString()
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

    it(`should handle a string for input, matching same-origin requests, and return a route that can be unregistered.`, async function() {
      const handlerSpy = sandbox.spy();

      const crossOrigin = 'https://cross-origin.example.com';
      const pathname = '/test/path';

      const route = defaultRouter.registerRoute(pathname, handlerSpy);
      expect(route).to.be.an.instanceof(Route);

      const sameOriginEvent = new FetchEvent('fetch', {
        request: new Request(
          new URL(pathname, self.location).toString()
        ),
      });
      await defaultRouter.handleRequest(sameOriginEvent);

      const sameOriginEventNotMatching = new FetchEvent('fetch', {
        request: new Request(
          new URL('/does/not/match', self.location).toString()
        ),
      });
      await defaultRouter.handleRequest(sameOriginEventNotMatching);

      const crossOriginEvent = new FetchEvent('fetch', {
        request: new Request(
          new URL(pathname, crossOrigin).toString()
        ),
      });
      await defaultRouter.handleRequest(crossOriginEvent);

      expect(handlerSpy.callCount).to.equal(1);
      expect(handlerSpy.getCall(0).args[0].event).to.equal(sameOriginEvent);

      sandbox.reset();

      defaultRouter.unregisterRoute(route);
      await defaultRouter.handleRequest(sameOriginEvent);
      expect(handlerSpy.callCount).to.equal(0);
    });

    it(`should handle a string for input, matching cross-origin requests, and return a route that can be unregistered.`, async function() {
      const handlerSpy = sandbox.spy();

      const crossOrigin = 'https://cross-origin.example.com';
      const pathname = '/test/path';

      const route = defaultRouter.registerRoute(`${crossOrigin}${pathname}`, handlerSpy);
      expect(route).to.be.an.instanceof(Route);

      const sameOriginEvent = new FetchEvent('fetch', {
        request: new Request(
          new URL(pathname, self.location).toString()
        ),
      });
      await defaultRouter.handleRequest(sameOriginEvent);

      const crossOriginEvent = new FetchEvent('fetch', {
        request: new Request(
          new URL(pathname, crossOrigin).toString()
        ),
      });
      await defaultRouter.handleRequest(crossOriginEvent);

      expect(handlerSpy.callCount).to.equal(1);
      expect(handlerSpy.getCall(0).args[0].event).to.equal(crossOriginEvent);

      sandbox.reset();

      defaultRouter.unregisterRoute(route);
      await defaultRouter.handleRequest(crossOriginEvent);
      expect(handlerSpy.callCount).to.equal(0);
    });

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

  describe(`registerNavigationRoute()`, function() {
    it(`should register a navigation route with defaults`, function() {
      sandbox.spy(NavigationRoute.prototype, 'constructor');
      const route = defaultRouter.registerNavigationRoute(`/shell.html`);
      expect(route).to.be.an.instanceof(NavigationRoute);
      expect(route._whitelist).to.deep.equal([/./]);
      expect(route._blacklist).to.deep.equal([]);
    });

    it(`should use supplied whitelist`, function() {
      const whitelist = [/test/];
      let route = defaultRouter.registerNavigationRoute(`/shell.html`, {
        whitelist,
      });
      expect(route._whitelist).to.deep.equal(whitelist);
      expect(route._blacklist).to.deep.equal([]);
    });

    it(`should use supplied blacklist`, function() {
      const blacklist = [/test/];
      let route = defaultRouter.registerNavigationRoute(`/shell.html`, {
        blacklist,
      });
      expect(route._whitelist).to.deep.equal([/./]);
      expect(route._blacklist).to.deep.equal(blacklist);
    });

    it(`should use supplied whitelist and blacklist`, function() {
      const whitelist = [/whitelist/];
      const blacklist = [/blacklist/];
      let route = defaultRouter.registerNavigationRoute(`/shell.html`, {
        whitelist,
        blacklist,
      });
      expect(route._whitelist).to.deep.equal(whitelist);
      expect(route._blacklist).to.deep.equal(blacklist);
    });

    it(`should return cached responses from precache by default`, async function() {
      const injectedResponse = new Response('Injected Response - Precache Cache');
      const openCache = await caches.open(cacheNames.getPrecacheName());
      await openCache.put('/shell.html', injectedResponse);

      const route = defaultRouter.registerNavigationRoute(`/shell.html`);
      const response = await route.handler.handle(new FetchEvent('fetch', {
        request: new Request('/random/navigation.html', {
          mode: 'navigate',
        }),
      }));
      expect(response).to.equal(injectedResponse);
    });

    it(`should use supplied cacheName`, async function() {
      const cacheName = 'example-cache-name';
      const injectedResponse = new Response('Injected Response - Custom Cache');
      const openCache = await caches.open(cacheName);
      await openCache.put('/shell.html', injectedResponse);

      const route = defaultRouter.registerNavigationRoute(`/shell.html`, {
        cacheName,
      });
      const response = await route.handler.handle(new FetchEvent('fetch', {
        request: new Request('/random/navigation.html', {
          mode: 'navigate',
        }),
      }));
      expect(response).to.equal(injectedResponse);
    });
  });

  describe(`Fetch Events`, function() {
    it(`should not call event methods for no route`, function() {
      sandbox.spy(defaultRouter, 'handleRequest');

      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(new URL('/random/navigation.html', self.location)),
      });
      sandbox.stub(fetchEvent, 'respondWith');
      self.dispatchEvent(fetchEvent);
      expect(defaultRouter.handleRequest.callCount).to.equal(1);
      expect(defaultRouter.handleRequest.args[0][0]).to.equal(fetchEvent);
      expect(fetchEvent.respondWith.callCount).to.equal(0);
    });

    it(`should pass Fetch Events to router.handleRequest`, function() {
      sandbox.spy(defaultRouter, 'handleRequest');

      const injectResponse = new Response(`Injected Response`);
      defaultRouter.registerRoute(/./, () => injectResponse);

      const fetchEvent = new FetchEvent(
        'fetch', {
          request: new Request(new URL('/random/navigation.html', self.location)),
        });
      return new Promise((resolve) => {
        sandbox.stub(fetchEvent, 'respondWith').callsFake((response) => {
          expect(response).to.equal(injectResponse);
          resolve();
        });
        self.dispatchEvent(fetchEvent);
        expect(defaultRouter.handleRequest.callCount).to.equal(1);
        expect(defaultRouter.handleRequest.args[0][0]).to.equal(fetchEvent);
        expect(fetchEvent.respondWith.callCount).to.equal(1);
      });
    });
  });
});
