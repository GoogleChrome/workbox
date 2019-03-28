/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import sinon from 'sinon';
import {expect} from 'chai';
import clearRequire from 'clear-require';

import {cacheNames} from '../../../packages/workbox-core/_private/cacheNames.mjs';


describe(`[workbox-routing] registerNavigationRoute()`, function() {
  const sandbox = sinon.createSandbox();

  let NavigationRoute;
  let registerNavigationRoute;
  let Router;

  beforeEach(async function() {
    sandbox.restore();

    const basePath = '../../../packages/workbox-routing/';

    // Clear the require cache and then re-import needed modules to assure
    // local variables are reset before each run.
    clearRequire.match(new RegExp('workbox-routing'));
    NavigationRoute = (await import(`${basePath}NavigationRoute.mjs`)).NavigationRoute;
    registerNavigationRoute = (await import(`${basePath}registerNavigationRoute.mjs`)).registerNavigationRoute;
    Router = (await import(`${basePath}Router.mjs`)).Router;
  });

  after(function() {
    sandbox.restore();
  });

  it(`should create a default router and add event listeners if one doens't exist`, function() {
    sandbox.spy(Router.prototype, 'addFetchListener');
    sandbox.spy(Router.prototype, 'addCacheListener');

    registerNavigationRoute('/abc', sandbox.spy());
    expect(Router.prototype.addFetchListener.callCount).to.equal(1);
    expect(Router.prototype.addCacheListener.callCount).to.equal(1);
  });

  it(`should not create more than one default router`, function() {
    sandbox.spy(Router.prototype, 'addFetchListener');
    sandbox.spy(Router.prototype, 'addCacheListener');

    registerNavigationRoute('/abc', sandbox.spy());
    expect(Router.prototype.addFetchListener.callCount).to.equal(1);
    expect(Router.prototype.addCacheListener.callCount).to.equal(1);

    // After running `registerNavigationRoute()` again, no new listeners should be added.
    registerNavigationRoute('/def', sandbox.spy());
    expect(Router.prototype.addFetchListener.callCount).to.equal(1);
    expect(Router.prototype.addCacheListener.callCount).to.equal(1);
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

    const route = registerNavigationRoute(`/shell.html`, {
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
    const shellURL = '/does-not-exist.html';

    const route = registerNavigationRoute(shellURL, {
      cacheName,
    });
    const response = await route.handler.handle(new FetchEvent('fetch', {
      request: new Request('/random/navigation.html', {
        mode: 'navigate',
      }),
    }));

    expect(fetchStub.calledOnce).to.be.true;
    expect(fetchStub.firstCall.args[0]).to.eql(shellURL);
    expect(response).to.eql(fakeResponse);
  });
});
