/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import sinon from 'sinon';
import {expect} from 'chai';

import {logger} from '../../../packages/workbox-core/_private/logger.mjs';
import expectError from '../../../infra/testing/expectError';
import {resetEventListeners} from '../../../infra/testing/sw-env-mocks/event-listeners';
import {DefaultRouter} from '../../../packages/workbox-routing/DefaultRouter.mjs';
import {NavigationRoute} from '../../../packages/workbox-routing/NavigationRoute.mjs';
import {RegExpRoute} from '../../../packages/workbox-routing/RegExpRoute.mjs';
import {Route} from '../../../packages/workbox-routing/Route.mjs';
import {cacheNames} from '../../../packages/workbox-core/_private/cacheNames.mjs';
import {devOnly} from '../../../infra/testing/env-it';

describe(`[workbox-routing] Default Router`, function() {
  const sandbox = sinon.createSandbox();
  let defaultRouter;

  beforeEach(function() {
    defaultRouter = new DefaultRouter();
    sandbox.restore();
    resetEventListeners();
  });

  after(function() {
    sandbox.restore();
    resetEventListeners();
  });

  describe(`contructor`, function() {
    it(`should add fetch and cache message listeners`, function() {
      sandbox.spy(DefaultRouter.prototype, 'addFetchListener');
      sandbox.spy(DefaultRouter.prototype, 'addCacheListener');

      new DefaultRouter();
      expect(DefaultRouter.prototype.addFetchListener.callCount).to.equal(1);
      expect(DefaultRouter.prototype.addCacheListener.callCount).to.equal(1);
    });
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

      const url = new URL('/abc', location);
      const request = new Request(url);
      const event = new FetchEvent('fetch', {request});

      await defaultRouter.handleRequest({request, event});

      expect(handlerSpy.callCount).to.equal(1);
      expect(handlerSpy.getCall(0).args[0].url).to.deep.equal(url);
      expect(handlerSpy.getCall(0).args[0].request).to.equal(request);
      expect(handlerSpy.getCall(0).args[0].event).to.equal(event);

      sandbox.resetHistory();

      defaultRouter.unregisterRoute(route);
      await defaultRouter.handleRequest({request, event});
      expect(handlerSpy.callCount).to.equal(0);
    });

    it(`should handle a string for input, matching same-origin requests, and return a route that can be unregistered.`, async function() {
      const handlerSpy = sandbox.spy();

      const crossOrigin = 'https://cross-origin.example.com';
      const pathname = '/test/path';

      const route = defaultRouter.registerRoute(pathname, handlerSpy);
      expect(route).to.be.an.instanceof(Route);

      const sameOriginUrl = new URL(pathname, location);
      const sameOriginRequest = new Request(sameOriginUrl);
      const sameOriginEvent =
          new FetchEvent('fetch', {request: sameOriginRequest});

      await defaultRouter.handleRequest({
        request: sameOriginRequest,
        event: sameOriginEvent,
      });

      const sameOriginUrlNotMatching = new URL('/does/not/match', location);
      const sameOriginRequestNotMatching =
          new Request(sameOriginUrlNotMatching);
      const sameOriginEventNotMatching =
          new FetchEvent('fetch', {request: sameOriginRequestNotMatching});

      await defaultRouter.handleRequest({
        request: sameOriginRequestNotMatching,
        event: sameOriginEventNotMatching,
      });

      const crossOriginUrl = new URL(pathname, crossOrigin);
      const crossOriginRequest = new Request(crossOriginUrl);
      const crossOriginEvent =
          new FetchEvent('fetch', {request: crossOriginRequest});

      await defaultRouter.handleRequest({
        request: crossOriginRequest,
        event: crossOriginEvent,
      });

      expect(handlerSpy.callCount).to.equal(1);
      expect(handlerSpy.firstCall.args[0].url).to.deep.equal(sameOriginUrl);
      expect(handlerSpy.firstCall.args[0].request).to.equal(sameOriginRequest);
      expect(handlerSpy.firstCall.args[0].event).to.equal(sameOriginEvent);

      sandbox.resetHistory();

      defaultRouter.unregisterRoute(route);
      await defaultRouter.handleRequest({
        request: sameOriginRequest,
        event: crossOriginEvent,
      });
      expect(handlerSpy.callCount).to.equal(0);
    });

    it(`should handle a string for input, matching cross-origin requests, and return a route that can be unregistered.`, async function() {
      const handlerSpy = sandbox.spy();

      const crossOrigin = 'https://cross-origin.example.com';
      const pathname = '/test/path';

      const route = defaultRouter.registerRoute(`${crossOrigin}${pathname}`, handlerSpy);
      expect(route).to.be.an.instanceof(Route);

      const sameOriginUrl = new URL(pathname, location);
      const sameOriginRequest = new Request(sameOriginUrl);
      const sameOriginEvent =
          new FetchEvent('fetch', {request: sameOriginRequest});

      await defaultRouter.handleRequest({
        request: sameOriginRequest,
        event: sameOriginEvent,
      });

      const crossOriginUrl = new URL(pathname, crossOrigin);
      const crossOriginRequest = new Request(crossOriginUrl);
      const crossOriginEvent =
          new FetchEvent('fetch', {request: crossOriginRequest});

      await defaultRouter.handleRequest({
        request: crossOriginRequest,
        event: crossOriginEvent,
      });

      expect(handlerSpy.callCount).to.equal(1);
      expect(handlerSpy.args[0][0].url).to.deep.equal(crossOriginUrl);
      expect(handlerSpy.args[0][0].request).to.equal(crossOriginRequest);
      expect(handlerSpy.args[0][0].event).to.equal(crossOriginEvent);
      sandbox.resetHistory();

      defaultRouter.unregisterRoute(route);
      await defaultRouter.handleRequest({
        request: crossOriginRequest,
        event: crossOriginEvent,
      });
      expect(handlerSpy.callCount).to.equal(0);
    });

    it(`should handle a regex for input and return a route that can be unregistered.`, async function() {
      const handlerSpy = sandbox.spy();

      const route = defaultRouter.registerRoute(/.*/, handlerSpy);
      expect(route).to.be.an.instanceof(RegExpRoute);

      const url = new URL('/', location);
      const request = new Request(url);
      const event = new FetchEvent('fetch', {request});
      await defaultRouter.handleRequest({request, event});

      expect(handlerSpy.callCount).to.equal(1);
      expect(handlerSpy.getCall(0).args[0].url).to.deep.equal(url);
      expect(handlerSpy.getCall(0).args[0].request).to.equal(request);
      expect(handlerSpy.getCall(0).args[0].event).to.equal(event);

      sandbox.resetHistory();

      defaultRouter.unregisterRoute(route);
      await defaultRouter.handleRequest({request, event});
      expect(handlerSpy.callCount).to.equal(0);
    });

    it(`should handle a function for input and return a route that can be unregistered.`, async function() {
      const captureSpy = sandbox.stub().returns(true);
      const handlerSpy = sandbox.spy();

      const route = defaultRouter.registerRoute(captureSpy, handlerSpy);
      expect(route).to.be.an.instanceof(Route);

      const url = new URL('/', location);
      const request = new Request(url);
      const event = new FetchEvent('fetch', {request});

      await defaultRouter.handleRequest({request, event});

      expect(captureSpy.callCount).to.equal(1);
      expect(handlerSpy.callCount).to.equal(1);
      expect(handlerSpy.getCall(0).args[0].url).to.deep.equal(url);
      expect(handlerSpy.getCall(0).args[0].request).to.equal(request);
      expect(handlerSpy.getCall(0).args[0].event).to.equal(event);

      sandbox.resetHistory();

      defaultRouter.unregisterRoute(route);
      await defaultRouter.handleRequest({request, event});
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

      const url = new URL('/', location);
      const request = new Request(url);
      const event = new FetchEvent('fetch', {request});

      await defaultRouter.handleRequest({request, event});

      expect(captureSpy.callCount).to.equal(1);
      expect(handlerSpy.callCount).to.equal(1);
      expect(handlerSpy.getCall(0).args[0].url).to.deep.equal(url);
      expect(handlerSpy.getCall(0).args[0].request).to.equal(request);
      expect(handlerSpy.getCall(0).args[0].event).to.equal(event);

      sandbox.resetHistory();

      defaultRouter.unregisterRoute(outputRoute);
      await defaultRouter.handleRequest({request, event});
      expect(captureSpy.callCount).to.equal(0);
      expect(handlerSpy.callCount).to.equal(0);
    });

    it(`should allow registering a class that extends Route`, async function() {
      const handlerSpy = sandbox.spy();

      const inputRoute = new RegExpRoute(/.*/, handlerSpy);
      const outputRoute = defaultRouter.registerRoute(inputRoute);
      expect(outputRoute).to.equal(inputRoute);

      const url = new URL('/', location);
      const request = new Request(url);
      const event = new FetchEvent('fetch', {request});

      await defaultRouter.handleRequest({request, event});
      expect(handlerSpy.callCount).to.equal(1);
      expect(handlerSpy.getCall(0).args[0].url).to.deep.equal(url);
      expect(handlerSpy.getCall(0).args[0].request).to.equal(request);
      expect(handlerSpy.getCall(0).args[0].event).to.equal(event);

      sandbox.resetHistory();

      defaultRouter.unregisterRoute(outputRoute);
      await defaultRouter.handleRequest({request, event});
      expect(handlerSpy.callCount).to.equal(0);
    });

    it(`should log for express styles routes`, function() {
      defaultRouter.registerRoute('/:example/', () => {});

      if (process.env.NODE_ENV !== 'production') {
        expect(logger.debug.callCount).to.be.gt(0);
      } else {
        expect(logger.debug.callCount).to.be.equal(0);
      }
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

    it(`should fetch() when there's a cache miss for the registered URL`, async function() {
      const fakeResponse = new Response('fake');
      const fetchStub = sandbox.stub(self, 'fetch').returns(fakeResponse);

      const cacheName = 'does-not-exist';
      const shellUrl = '/does-not-exist.html';

      const route = defaultRouter.registerNavigationRoute(shellUrl, {
        cacheName,
      });
      const response = await route.handler.handle(new FetchEvent('fetch', {
        request: new Request('/random/navigation.html', {
          mode: 'navigate',
        }),
      }));

      expect(fetchStub.calledOnce).to.be.true;
      expect(fetchStub.firstCall.args[0]).to.eql(shellUrl);
      expect(response).to.eql(fakeResponse);
    });
  });
});
