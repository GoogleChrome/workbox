/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from 'workbox-core/_private/logger.mjs';
import {getOrCreateDefaultRouter} from 'workbox-routing/utils/getOrCreateDefaultRouter.mjs';
import {RegExpRoute} from 'workbox-routing/RegExpRoute.mjs';
import {registerRoute} from 'workbox-routing/registerRoute.mjs';
import {Route} from 'workbox-routing/Route.mjs';

describe(`registerRoute()`, function () {
  const sandbox = sinon.createSandbox();
  let defaultRouter;

  beforeEach(async function () {
    sandbox.restore();

    if (logger) {
      sandbox.stub(logger, 'debug');
    }

    // Spy on all added event listeners so they can be removed.
    sandbox.spy(self, 'addEventListener');

    defaultRouter = getOrCreateDefaultRouter();

    // Spy on all routes added to the default router so they can be removed.
    sandbox.spy(defaultRouter, 'registerRoute');
  });

  afterEach(function () {
    for (const args of self.addEventListener.args) {
      self.removeEventListener(...args);
    }
    for (const args of defaultRouter.registerRoute.args) {
      defaultRouter.unregisterRoute(...args);
    }
    sandbox.restore();
  });

  // This is needed because we're skipping the last test, which for some
  // reasons seems to be skipping the afterEach hook:
  // https://github.com/mochajs/mocha/pull/2571#issuecomment-477407091
  after(function () {
    sandbox.restore();
  });

  it(`should use the default router instance`, function () {
    expect(defaultRouter.registerRoute.callCount).to.equal(0);
    registerRoute('/abc', sandbox.spy());
    expect(defaultRouter.registerRoute.callCount).to.equal(1);
  });

  it(`should throw when using a string that doesn't start with '/' or 'http' is used.`, async function () {
    if (process.env.NODE_ENV === 'production') this.skip();

    await expectError(
      () => registerRoute('invalid-start', sandbox.stub()),
      'invalid-string',
      (error) => {
        expect(error.details)
          .to.have.property('moduleName')
          .that.equals('workbox-routing');
        expect(error.details)
          .to.have.property('funcName')
          .that.equals('registerRoute');
        expect(error.details)
          .to.have.property('paramName')
          .that.equals('capture');
      },
    );
  });

  it(`should handle a string for input and return a route that can be unregistered.`, async function () {
    const defaultRouter = getOrCreateDefaultRouter();
    const handlerSpy = sandbox.spy();

    const route = registerRoute('/abc', handlerSpy);
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

  it(`should handle a string for input, matching same-origin requests, and return a route that can be unregistered.`, async function () {
    const defaultRouter = getOrCreateDefaultRouter();
    const handlerSpy = sandbox.spy();

    const crossOrigin = 'https://cross-origin.example.com';
    const pathname = '/test/path';

    const route = registerRoute(pathname, handlerSpy);
    expect(route).to.be.an.instanceof(Route);

    const sameOriginURL = new URL(pathname, location);
    const sameOriginRequest = new Request(sameOriginURL);
    const sameOriginEvent = new FetchEvent('fetch', {
      request: sameOriginRequest,
    });

    await defaultRouter.handleRequest({
      request: sameOriginRequest,
      event: sameOriginEvent,
    });

    const sameOriginURLNotMatching = new URL('/does/not/match', location);
    const sameOriginRequestNotMatching = new Request(sameOriginURLNotMatching);
    const sameOriginEventNotMatching = new FetchEvent('fetch', {
      request: sameOriginRequestNotMatching,
    });

    await defaultRouter.handleRequest({
      request: sameOriginRequestNotMatching,
      event: sameOriginEventNotMatching,
    });

    const crossOriginURL = new URL(pathname, crossOrigin);
    const crossOriginRequest = new Request(crossOriginURL);
    const crossOriginEvent = new FetchEvent('fetch', {
      request: crossOriginRequest,
    });

    await defaultRouter.handleRequest({
      request: crossOriginRequest,
      event: crossOriginEvent,
    });

    expect(handlerSpy.callCount).to.equal(1);
    expect(handlerSpy.firstCall.args[0].url).to.deep.equal(sameOriginURL);
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

  it(`should handle a string for input, matching cross-origin requests, and return a route that can be unregistered.`, async function () {
    const defaultRouter = getOrCreateDefaultRouter();
    const handlerSpy = sandbox.spy();

    const crossOrigin = 'https://cross-origin.example.com';
    const pathname = '/test/path';

    const route = registerRoute(`${crossOrigin}${pathname}`, handlerSpy);
    expect(route).to.be.an.instanceof(Route);

    const sameOriginURL = new URL(pathname, location);
    const sameOriginRequest = new Request(sameOriginURL);
    const sameOriginEvent = new FetchEvent('fetch', {
      request: sameOriginRequest,
    });

    await defaultRouter.handleRequest({
      request: sameOriginRequest,
      event: sameOriginEvent,
    });

    const crossOriginURL = new URL(pathname, crossOrigin);
    const crossOriginRequest = new Request(crossOriginURL);
    const crossOriginEvent = new FetchEvent('fetch', {
      request: crossOriginRequest,
    });

    await defaultRouter.handleRequest({
      request: crossOriginRequest,
      event: crossOriginEvent,
    });

    expect(handlerSpy.callCount).to.equal(1);
    expect(handlerSpy.args[0][0].url).to.deep.equal(crossOriginURL);
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

  it(`should handle a regex for input and return a route that can be unregistered.`, async function () {
    const defaultRouter = getOrCreateDefaultRouter();
    const handlerSpy = sandbox.spy();

    const route = registerRoute(/.*/, handlerSpy);
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

  it(`should handle a function for input and return a route that can be unregistered.`, async function () {
    const defaultRouter = getOrCreateDefaultRouter();
    const captureSpy = sandbox.stub().returns(true);
    const handlerSpy = sandbox.spy();

    const route = registerRoute(captureSpy, handlerSpy);
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

  it(`should throw on unexpected capture`, function () {
    return expectError(() => {
      registerRoute([], () => {});
    }, 'unsupported-route-type');
  });

  it(`should allow registering a normal Route`, async function () {
    const defaultRouter = getOrCreateDefaultRouter();
    const captureSpy = sandbox.stub().callsFake(() => true);
    const handlerSpy = sandbox.spy();

    const inputRoute = new Route(captureSpy, handlerSpy);
    const outputRoute = registerRoute(inputRoute);
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

  it(`should allow registering a class that extends Route`, async function () {
    const defaultRouter = getOrCreateDefaultRouter();
    const handlerSpy = sandbox.spy();

    const inputRoute = new RegExpRoute(/.*/, handlerSpy);
    const outputRoute = registerRoute(inputRoute);
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

  it(`should log for express styles routes`, function () {
    if (process.env.NODE_ENV === 'production') this.skip();

    registerRoute('/:example/', () => {});

    expect(logger.debug.callCount).to.be.gt(0);
  });
});
