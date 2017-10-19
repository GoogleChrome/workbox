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

    clearRequire('../../../../packages/workbox-precaching/default.mjs');

    const module = await import('../../../../packages/workbox-precaching/default.mjs');
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
      sandbox.spy(PrecacheController.prototype, 'install');
      sandbox.spy(PrecacheController.prototype, 'cleanup');

      expect(PrecacheController.prototype.install.callCount).to.equal(0);

      precaching.precache(['/']);

      const installEvent = new ExtendableEvent('install');
      let controllerInstallPromise;
      installEvent.waitUntil = (promise) => {
        controllerInstallPromise = promise;
      };
      self.dispatchEvent(installEvent);

      await controllerInstallPromise;
      expect(PrecacheController.prototype.install.callCount).to.equal(1);

      const activateEvent = new ExtendableEvent('activate');
      let controllerActivatePromise;
      activateEvent.waitUntil = (promise) => {
        controllerActivatePromise = promise;
      };
      self.dispatchEvent(activateEvent);

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

    it(`should return null if there is no match (event with directoryIndex) 'index.html'`, async function() {
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
});
