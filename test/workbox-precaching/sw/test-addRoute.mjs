/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import sinon from 'sinon';
import {expect} from 'chai';
import clearRequire from 'clear-require';
import {cacheNames} from '../../../packages/workbox-core/cacheNames.mjs';


describe(`[workbox-precaching] addRoute()`, function() {
  const sandbox = sinon.createSandbox();
  let precache;
  let addRoute;

  beforeEach(async function() {
    sandbox.restore();

    const basePath = '../../../packages/workbox-precaching/';

    // Clear the require cache and then re-import needed modules to assure
    // local variables are reset before each run.
    clearRequire.match(new RegExp('workbox-precaching'));
    addRoute = (await import(`${basePath}addRoute.mjs`)).addRoute;
    precache = (await import(`${basePath}precache.mjs`)).precache;
  });

  after(function() {
    sandbox.restore();
  });

  describe(`addRoute()`, function() {
    it(`should add a fetch listener when called`, function() {
      sandbox.stub(self, 'addEventListener');

      addRoute();

      expect(self.addEventListener.callCount).to.equal(1);
      expect(self.addEventListener.args[0][0]).to.equal('fetch');
    });

    it(`should not allow adding route twice`, function() {
      sandbox.stub(self, 'addEventListener');

      addRoute();
      addRoute();

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

      addRoute();
      precache(['/']);

      const cachedResponse = new Response('Injected Response');
      const cache = await caches.open(cacheNames.precache);
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
      const cache = await caches.open(cacheNames.precache);
      cache.put(new URL(`/?${SEARCH_1}&${SEARCH_2}`, location).href, cachedResponse);

      addRoute({
        ignoreURLParametersMatching: [/ignoreMe/],
      });
      precache([`/?${SEARCH_1}&${SEARCH_2}`]);

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
      const cache = await caches.open(cacheNames.precache);
      cache.put(new URL(`/?${SEARCH_1}&${SEARCH_2}`, location).href, cachedResponse);

      addRoute({
        ignoreURLParametersMatching: [/ignoreMe/],
      });
      precache([`/?${SEARCH_1}&${SEARCH_2}`]);

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
      const cache = await caches.open(cacheNames.precache);
      cache.put(new URL(`/${DIRECTORY_INDEX}`, location).href, cachedResponse);

      addRoute({
        directoryIndex: DIRECTORY_INDEX,
      });
      precache([`/${DIRECTORY_INDEX}`]);

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
      const cache = await caches.open(cacheNames.precache);
      cache.put(new URL(`/${DIRECTORY_INDEX}`, location).href, cachedResponse);

      addRoute();
      precache([`/${DIRECTORY_INDEX}`]);

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

    it(`should use the cleanURLs of 'about.html'`, async function() {
      let fetchCb;
      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        if (eventName === 'fetch') {
          fetchCb = cb;
        }
      });

      const PRECACHED_FILE = 'about.html';

      const cachedResponse = new Response('Injected Response');
      const cache = await caches.open(cacheNames.precache);
      cache.put(new URL(`/${PRECACHED_FILE}`, location).href, cachedResponse);

      addRoute();
      precache([`/${PRECACHED_FILE}`]);

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

    it(`should *not* use the cleanURLs of 'about.html' if set to false`, async function() {
      let fetchCb;
      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        if (eventName === 'fetch') {
          fetchCb = cb;
        }
      });

      const PRECACHED_FILE = 'about.html';

      const cachedResponse = new Response('Injected Response');
      const cache = await caches.open(cacheNames.precache);
      cache.put(new URL(`/${PRECACHED_FILE}`, location).href, cachedResponse);

      addRoute({
        cleanURLs: false,
      });
      precache([`/${PRECACHED_FILE}`]);

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

    it(`should use a custom urlManipulation function`, async function() {
      let fetchCb;
      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        if (eventName === 'fetch') {
          fetchCb = cb;
        }
      });

      const PRECACHED_FILE = '123.html';

      const cachedResponse = new Response('Injected Response');
      const cache = await caches.open(cacheNames.precache);
      await cache.put(new URL(`/${PRECACHED_FILE}`, location).href, cachedResponse);

      addRoute({
        urlManipulation: ({url}) => {
          expect(url.pathname).to.equal('/');
          const customURL = new URL(url);
          customURL.pathname = PRECACHED_FILE;
          return [
            customURL,
          ];
        },
      });
      precache([`/${PRECACHED_FILE}`]);

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
      const cache = await caches.open(cacheNames.precache);
      cache.put(new URL(`/something-else.html`, location).href, cachedResponse);

      addRoute();
      precache([`/something-else.html`]);

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

      addRoute();
      // Because the install handler is not called in this test, there won't be
      // a cache entry for url, even though precache() is called.
      precache([url]);

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
});
