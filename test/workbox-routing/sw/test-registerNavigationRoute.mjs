/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cacheNames} from 'workbox-core/_private/cacheNames.mjs';
import {getOrCreateDefaultRouter} from 'workbox-routing/utils/getOrCreateDefaultRouter.mjs';
import {NavigationRoute} from 'workbox-routing/NavigationRoute.mjs';
import {registerNavigationRoute} from 'workbox-routing/registerNavigationRoute.mjs';


describe(`registerNavigationRoute()`, function() {
  const sandbox = sinon.createSandbox();
  let defaultRouter;

  beforeEach(async function() {
    sandbox.restore();

    // Spy on all added event listeners so they can be removed.
    sandbox.spy(self, 'addEventListener');

    defaultRouter = getOrCreateDefaultRouter();

    // Spy on all routes added to the default router so they can be removed.
    sandbox.spy(defaultRouter, 'registerRoute');
  });

  afterEach(function() {
    for (const args of self.addEventListener.args) {
      self.removeEventListener(...args);
    }
    for (const args of defaultRouter.registerRoute.args) {
      defaultRouter.unregisterRoute(...args);
    }
    sandbox.restore();
  });

  it(`should use the default router instance`, function() {
    expect(defaultRouter.registerRoute.callCount).to.equal(0);
    registerNavigationRoute('/abc');
    expect(defaultRouter.registerRoute.callCount).to.equal(1);
  });

  it(`should register a navigation route with defaults`, function() {
    sandbox.spy(NavigationRoute.prototype, 'constructor');
    const route = registerNavigationRoute(`/shell.html`);
    expect(route).to.be.an.instanceof(NavigationRoute);
    expect(route._whitelist).to.deep.equal([/./]);
    expect(route._blacklist).to.deep.equal([]);
  });

  it(`should use supplied whitelist`, function() {
    const whitelist = [/test/];
    let route = registerNavigationRoute(`/shell.html`, {
      whitelist,
    });
    expect(route._whitelist).to.deep.equal(whitelist);
    expect(route._blacklist).to.deep.equal([]);
  });

  it(`should use supplied blacklist`, function() {
    const blacklist = [/test/];
    let route = registerNavigationRoute(`/shell.html`, {
      blacklist,
    });
    expect(route._whitelist).to.deep.equal([/./]);
    expect(route._blacklist).to.deep.equal(blacklist);
  });

  it(`should use supplied whitelist and blacklist`, function() {
    const whitelist = [/whitelist/];
    const blacklist = [/blacklist/];
    let route = registerNavigationRoute(`/shell.html`, {
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

    const route = registerNavigationRoute(`/shell.html`);
    const navigationRequest = new Request('/random/navigation.html');
    sandbox.stub(navigationRequest, 'mode').value('navigate');

    const response = await route.handler.handle(new FetchEvent('fetch', {
      request: navigationRequest,
    }));

    expect(await response.text()).to.equal('Injected Response - Precache Cache');
  });

  it(`should use supplied cacheName`, async function() {
    const cacheName = 'example-cache-name';
    const injectedResponse = new Response('Injected Response - Custom Cache');
    const openCache = await caches.open(cacheName);
    await openCache.put('/shell.html', injectedResponse);

    const route = registerNavigationRoute(`/shell.html`, {
      cacheName,
    });
    const navigationRequest = new Request('/random/navigation.html');
    sandbox.stub(navigationRequest, 'mode').value('navigate');

    const response = await route.handler.handle(new FetchEvent('fetch', {
      request: navigationRequest,
    }));
    expect(await response.text()).to.equal('Injected Response - Custom Cache');
  });

  it(`should fetch() when there's a cache miss for the registered URL`, async function() {
    const fakeResponse = new Response('fake');
    const fetchStub = sandbox.stub(self, 'fetch').returns(fakeResponse);

    const cacheName = 'does-not-exist';
    const shellURL = '/does-not-exist.html';

    const route = registerNavigationRoute(shellURL, {
      cacheName,
    });
    const navigationRequest = new Request('/random/navigation.html');
    sandbox.stub(navigationRequest, 'mode').value('navigate');

    const response = await route.handler.handle(new FetchEvent('fetch', {
      request: navigationRequest,
    }));

    expect(fetchStub.calledOnce).to.be.true;
    expect(fetchStub.firstCall.args[0]).to.eql(shellURL);
    expect(await response.text()).to.equal('fake');
  });
});
