import sinon from 'sinon';
import {expect} from 'chai';
import clearRequire from 'clear-require';

import core from '../../../../packages/workbox-core/index.mjs';
import PrecacheController from '../../../../packages/workbox-precaching/controllers/PrecacheController.mjs';

describe(`[workbox-precaching] default export`, function() {
  const sandbox = sinon.sandbox.create();
  let precaching;

  beforeEach(async function() {
    sandbox.restore();

    clearRequire('../../../../packages/workbox-precaching/_default.mjs');

    const module = await import('../../../../packages/workbox-precaching/_default.mjs');
    precaching = module.default;
  });

  after(function() {
    sandbox.restore();
  });

  describe(`precache()`, function() {
    it(`should only install and activate listeners once`, function() {
      sandbox.stub(self, 'addEventListener');

      precaching.precache(['/']);
      precaching.precache(['/2']);

      expect(self.addEventListener.callCount).to.equal(2);
      expect(self.addEventListener.args[0][0]).to.equal('install');
      expect(self.addEventListener.args[1][0]).to.equal('activate');
    });

    it(`should call install and cleanup on install and activate`, async function() {
      let eventCallbacks = {};
      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        eventCallbacks[eventName] = cb;
      });
      sandbox.spy(PrecacheController.prototype, 'install');
      sandbox.spy(PrecacheController.prototype, 'cleanup');

      expect(PrecacheController.prototype.install.callCount).to.equal(0);

      precaching.precache(['/']);

      const installEvent = new ExtendableEvent('install');
      let controllerInstallPromise;
      installEvent.waitUntil = (promise) => {
        controllerInstallPromise = promise;
      };
      eventCallbacks['install'](installEvent);

      await controllerInstallPromise;
      expect(PrecacheController.prototype.install.callCount).to.equal(1);

      const activateEvent = new ExtendableEvent('activate');
      let controllerActivatePromise;
      activateEvent.waitUntil = (promise) => {
        controllerActivatePromise = promise;
      };
      eventCallbacks['activate'](installEvent);

      await controllerActivatePromise;
      expect(PrecacheController.prototype.cleanup.callCount).to.equal(1);
    });
  });

  describe(`addRoute()`, function() {
    it(`should add a fetch listener when called`, function() {
      sandbox.stub(self, 'addEventListener');

      precaching.addRoute();

      expect(self.addEventListener.callCount).to.equal(1);
      expect(self.addEventListener.args[0][0]).to.equal('fetch');
    });

    it(`should not allow adding route twice`, function() {
      sandbox.stub(self, 'addEventListener');

      precaching.addRoute();
      precaching.addRoute();

      expect(self.addEventListener.callCount).to.equal(1);
      expect(self.addEventListener.args[0][0]).to.equal('fetch');
    });

    it(`should add a fetch listener that only matches precached urls`, async function() {
      let fetchCb;
      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        if (eventName === 'fetch') {
          fetchCb = cb;
        }
      });

      precaching.addRoute();
      precaching.precache(['/']);

      const cachedResponse = new Response('Injected Response');
      const cache = await caches.open(core.cacheNames.precache);
      cache.put(new URL('/', location).href, cachedResponse);

      const fetchEvent = new FetchEvent('fetch', {
        request: new Request('/'),
      });
      let fetchPromise;
      fetchEvent.respondWith = (promise) => {
        fetchPromise = promise;
      };
      fetchCb(fetchEvent);

      const response = await fetchPromise;
      expect(response).to.exist;
      expect(response).to.equal(cachedResponse);

      const unprecachedFetchEvent = new FetchEvent('fetch', {
        request: new Request('/url-isnt-precached'),
      });

      unprecachedFetchEvent.respondWith = () => {
        throw new Error('respondWith() must not be called for non-precached URLs');
      };

      const result = fetchCb(unprecachedFetchEvent);
      expect(typeof result).to.equal('undefined');
    });

    it(`should add a fetch listener that matches precached urls with ignored params`, async function() {
      let fetchCb;
      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        if (eventName === 'fetch') {
          fetchCb = cb;
        }
      });

      const SEARCH_1 = 'paramsTest1=1';
      const SEARCH_2 = 'paramsTest2=2';
      const SEARCH_IGNORE = 'ignoreMe=ignore';

      const cachedResponse = new Response('Injected Response');
      const cache = await caches.open(core.cacheNames.precache);
      cache.put(new URL(`/?${SEARCH_1}&${SEARCH_2}`, location).href, cachedResponse);

      precaching.addRoute({
        ignoreUrlParametersMatching: [/ignoreMe/],
      });
      precaching.precache([`/?${SEARCH_1}&${SEARCH_2}`]);

      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(`/?${SEARCH_IGNORE}&${SEARCH_1}&${SEARCH_2}`),
      });
      let fetchPromise;
      fetchEvent.respondWith = (promise) => {
        fetchPromise = promise;
      };
      fetchCb(fetchEvent);

      const response = await fetchPromise;
      expect(response).to.exist;
      expect(response).to.equal(cachedResponse);
    });

    // Should we sort the search params to ensure that matches are consistent
    it.skip(`should match search params out of order`, async function() {
      let fetchCb;
      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        if (eventName === 'fetch') {
          fetchCb = cb;
        }
      });

      const SEARCH_1 = 'paramsTest1=1';
      const SEARCH_2 = 'paramsTest2=2';
      const SEARCH_IGNORE = 'ignoreMe=ignore';

      const cachedResponse = new Response('Injected Response');
      const cache = await caches.open(core.cacheNames.precache);
      cache.put(new URL(`/?${SEARCH_1}&${SEARCH_2}`, location).href, cachedResponse);

      precaching.addRoute({
        ignoreUrlParametersMatching: [/ignoreMe/],
      });
      precaching.precache([`/?${SEARCH_1}&${SEARCH_2}`]);

      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(`/?${SEARCH_2}&${SEARCH_IGNORE}&${SEARCH_1}`),
      });
      let fetchPromise;
      fetchEvent.respondWith = (promise) => {
        fetchPromise = promise;
      };
      fetchCb(fetchEvent);

      const response = await fetchPromise;
      expect(response).to.exist;
      expect(response).to.equal(cachedResponse);
    });

    it(`should use the directoryIndex if the original request fails`, async function() {
      let fetchCb;
      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        if (eventName === 'fetch') {
          fetchCb = cb;
        }
      });

      const DIRECTORY_INDEX = 'test-index.html';

      const cachedResponse = new Response('Injected Response');
      const cache = await caches.open(core.cacheNames.precache);
      cache.put(new URL(`/${DIRECTORY_INDEX}`, location).href, cachedResponse);

      precaching.addRoute({
        directoryIndex: DIRECTORY_INDEX,
      });
      precaching.precache([`/${DIRECTORY_INDEX}`]);

      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(`/`),
      });
      let fetchPromise;
      fetchEvent.respondWith = (promise) => {
        fetchPromise = promise;
      };
      fetchCb(fetchEvent);

      const response = await fetchPromise;
      expect(response).to.exist;
      expect(response).to.equal(cachedResponse);
    });

    it(`should use the default directoryIndex of 'index.html'`, async function() {
      let fetchCb;
      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        if (eventName === 'fetch') {
          fetchCb = cb;
        }
      });

      const DIRECTORY_INDEX = 'index.html';

      const cachedResponse = new Response('Injected Response');
      const cache = await caches.open(core.cacheNames.precache);
      cache.put(new URL(`/${DIRECTORY_INDEX}`, location).href, cachedResponse);

      precaching.addRoute();
      precaching.precache([`/${DIRECTORY_INDEX}`]);

      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(`/`),
      });
      let fetchPromise;
      fetchEvent.respondWith = (promise) => {
        fetchPromise = promise;
      };
      fetchCb(fetchEvent);

      const response = await fetchPromise;
      expect(response).to.exist;
      expect(response).to.equal(cachedResponse);
    });

    it(`should use the cleanUrls of 'about.html'`, async function() {
      let fetchCb;
      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        if (eventName === 'fetch') {
          fetchCb = cb;
        }
      });

      const PRECACHED_FILE = 'about.html';

      const cachedResponse = new Response('Injected Response');
      const cache = await caches.open(core.cacheNames.precache);
      cache.put(new URL(`/${PRECACHED_FILE}`, location).href, cachedResponse);

      precaching.addRoute();
      precaching.precache([`/${PRECACHED_FILE}`]);

      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(`/about`),
      });
      let fetchPromise;
      fetchEvent.respondWith = (promise) => {
        fetchPromise = promise;
      };
      fetchCb(fetchEvent);

      const response = await fetchPromise;
      expect(response).to.exist;
      expect(response).to.equal(cachedResponse);
    });

    it(`should *not* use the cleanUrls of 'about.html' if set to false`, async function() {
      let fetchCb;
      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        if (eventName === 'fetch') {
          fetchCb = cb;
        }
      });

      const PRECACHED_FILE = 'about.html';

      const cachedResponse = new Response('Injected Response');
      const cache = await caches.open(core.cacheNames.precache);
      cache.put(new URL(`/${PRECACHED_FILE}`, location).href, cachedResponse);

      precaching.addRoute({
        cleanUrls: false,
      });
      precaching.precache([`/${PRECACHED_FILE}`]);

      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(`/about`),
      });
      let fetchPromise;
      fetchEvent.respondWith = (promise) => {
        fetchPromise = promise;
      };
      fetchCb(fetchEvent);

      const response = await fetchPromise;
      expect(response).to.not.exist;
    });

    it(`should use custom urlManipulation function`, async function() {
      let fetchCb;
      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        if (eventName === 'fetch') {
          fetchCb = cb;
        }
      });

      const PRECACHED_FILE = '123.html';

      const cachedResponse = new Response('Injected Response');
      const cache = await caches.open(core.cacheNames.precache);
      cache.put(new URL(`/${PRECACHED_FILE}`, location).href, cachedResponse);

      precaching.addRoute({
        urlManipulation: ({url}) => {
          expect(url.pathname).to.equal('/');

          const customUrl = new URL(url);
          customUrl.pathname = '123.html';
          return [
            customUrl,
          ];
        },
      });
      precaching.precache([`/${PRECACHED_FILE}`]);

      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(`/`),
      });
      let fetchPromise;
      fetchEvent.respondWith = (promise) => {
        fetchPromise = promise;
      };
      fetchCb(fetchEvent);

      const response = await fetchPromise;
      expect(response).to.exist;
      expect(response).to.equal(cachedResponse);
    });

    it(`should return null if there is no match`, async function() {
      let fetchCb;
      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        if (eventName === 'fetch') {
          fetchCb = cb;
        }
      });

      const cachedResponse = new Response('Injected Response');
      const cache = await caches.open(core.cacheNames.precache);
      cache.put(new URL(`/something-else.html`, location).href, cachedResponse);

      precaching.addRoute();
      precaching.precache([`/something-else.html`]);

      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(`/`),
      });
      let fetchPromise;
      fetchEvent.respondWith = (promise) => {
        fetchPromise = promise;
      };
      fetchCb(fetchEvent);

      const response = await fetchPromise;
      expect(response).to.not.exist;
    });

    it(`should call fetch() if there's a missing entry for a URL that has been precached`, async function() {
      const fetchResponse = new Response('From fetch()');
      const fetchStub = sandbox.stub(self, 'fetch').returns(fetchResponse);

      const url = '/some-url';

      let fetchCb;
      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        if (eventName === 'fetch') {
          fetchCb = cb;
        }
      });

      precaching.addRoute();
      // Because the install handler is not called in this test, there won't be
      // a cache entry for url, even though precache() is called.
      precaching.precache([url]);

      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(url),
      });
      let responsePromise;
      fetchEvent.respondWith = (promise) => {
        responsePromise = promise;
      };
      fetchCb(fetchEvent);

      const response = await responsePromise;

      expect(fetchStub.calledOnce).to.be.true;
      expect(response).to.eql(fetchResponse);
    });
  });

  describe(`precacheAndRoute()`, function() {
    it(`should call precache() and addRoute() without args`, function() {
      sandbox.stub(precaching, 'precache');
      sandbox.stub(precaching, 'addRoute');

      precaching.precacheAndRoute();

      expect(precaching.precache.callCount).to.equal(1);
      expect(precaching.precache.args[0]).to.deep.equal([undefined]);
      expect(precaching.addRoute.callCount).to.equal(1);
      expect(precaching.addRoute.args[0]).to.deep.equal([undefined]);
    });

    it(`should call precache() and addRoute() with args`, function() {
      sandbox.stub(precaching, 'precache');
      sandbox.stub(precaching, 'addRoute');

      const precacheArgs = ['/'];
      const routeOptions = {
        ignoreUrlParametersMatching: [/utm_/],
        directoryIndex: 'example.html',
      };
      precaching.precacheAndRoute(precacheArgs, routeOptions);

      expect(precaching.precache.callCount).to.equal(1);
      expect(precaching.precache.args[0][0]).to.equal(precacheArgs);
      expect(precaching.addRoute.callCount).to.equal(1);
      expect(precaching.addRoute.args[0][0]).to.equal(routeOptions);
    });
  });

  describe(`suppressWarnings()`, function() {
    it(`should suppress warnings during install`, async function() {
      let eventCallbacks = {};
      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        eventCallbacks[eventName] = cb;
      });
      sandbox.spy(PrecacheController.prototype, 'install');

      const precacheArgs = ['/'];

      precaching.precache(precacheArgs);
      precaching.suppressWarnings(true);

      const installEvent = new ExtendableEvent('install');
      let installPromise;
      installEvent.waitUntil = (promise) => {
        installPromise = promise;
      };
      eventCallbacks['install'](installEvent);

      await installPromise;

      expect(PrecacheController.prototype.install.args[0][0].suppressWarnings).to.equal(true);
    });
  });

  describe(`addPlugins()`, function() {
    it(`should add plugins during install`, async function() {
      let eventCallbacks = {};
      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        eventCallbacks[eventName] = cb;
      });
      sandbox.spy(PrecacheController.prototype, 'install');

      const precacheArgs = ['/'];

      const plugin1 = {
        name: 'plugin1',
      };
      const plugin2 = {
        name: 'plugin2',
      };

      precaching.precache(precacheArgs);
      precaching.addPlugins([plugin1]);
      precaching.addPlugins([plugin2]);

      const installEvent = new ExtendableEvent('install');
      let installPromise;
      installEvent.waitUntil = (promise) => {
        installPromise = promise;
      };
      eventCallbacks['install'](installEvent);

      await installPromise;

      expect(PrecacheController.prototype.install.args[0][0].plugins).to.deep.equal([
        plugin1,
        plugin2,
      ]);
    });
  });
});
