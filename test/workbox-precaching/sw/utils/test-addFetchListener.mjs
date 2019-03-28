/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cacheNames} from 'workbox-core/cacheNames.mjs';
import {addFetchListener} from 'workbox-precaching/utils/addFetchListener.mjs';
import {precache} from 'workbox-precaching/precache.mjs';
import {getOrCreatePrecacheController} from 'workbox-precaching/utils/getOrCreatePrecacheController.mjs';
import {dispatchAndWaitForResponse} from '../../../../infra/testing/helpers/extendable-event-utils.mjs';

describe(`addFetchListener()`, function() {
  const sandbox = sinon.createSandbox();

  beforeEach(async function() {
    sandbox.restore();

    // Spy on all added event listeners so they can be removed.
    sandbox.spy(self, 'addEventListener');

    // Clear all caches.
    const cacheKeys = await caches.keys();
    for (const cacheKey of cacheKeys) {
      await caches.delete(cacheKey);
    }

    // Reset the `_urlsToCacheKeys` map on the default PrecacheController.
    getOrCreatePrecacheController()._urlsToCacheKeys = new Map();
  });

  afterEach(function() {
    for (const args of self.addEventListener.args) {
      self.removeEventListener(...args);
    }
    sandbox.restore();
  });

  it(`should add a fetch listener when called`, function() {
    addFetchListener();

    expect(self.addEventListener.callCount).to.equal(1);
    expect(self.addEventListener.args[0][0]).to.equal('fetch');
  });

  it(`should add a fetch listener that only matches precached urls`, async function() {
    addFetchListener();
    precache(['/']);

    const cachedResponse = new Response('Injected Response');
    const cache = await caches.open(cacheNames.precache);
    await cache.put(new URL('/', location).href, cachedResponse);

    const fetchEvent1 = new FetchEvent('fetch', {request: new Request('/')});
    const fetchResponse1 = await dispatchAndWaitForResponse(fetchEvent1);

    expect(fetchResponse1).to.exist;
    expect(await fetchResponse1.text()).to.equal('Injected Response');

    const fetchEvent2 = new FetchEvent('fetch', {
      request: new Request('/url-isnt-precached'),
    });
    const fetchResponse2 = await dispatchAndWaitForResponse(fetchEvent2);

    expect(fetchResponse2).to.equal(undefined);
  });

  it(`should add a fetch listener that matches precached urls with ignored params`, async function() {
    const SEARCH_1 = 'paramsTest1=1';
    const SEARCH_2 = 'paramsTest2=2';
    const SEARCH_IGNORE = 'ignoreMe=ignore';

    const cachedResponse = new Response('Injected Response');
    const cache = await caches.open(cacheNames.precache);
    await cache.put(new URL(`/?${SEARCH_1}&${SEARCH_2}`, location).href, cachedResponse);

    addFetchListener({
      ignoreURLParametersMatching: [/ignoreMe/],
    });
    precache([`/?${SEARCH_1}&${SEARCH_2}`]);

    const fetchEvent = new FetchEvent('fetch', {
      request: new Request(`/?${SEARCH_IGNORE}&${SEARCH_1}&${SEARCH_2}`),
    });
    const fetchResponse = await dispatchAndWaitForResponse(fetchEvent);

    expect(fetchResponse).to.exist;
    expect(await fetchResponse.text()).to.equal('Injected Response');
  });

  // Should we sort the search params to ensure that matches are consistent
  it.skip(`should match search params out of order`, async function() {
    const SEARCH_1 = 'paramsTest1=1';
    const SEARCH_2 = 'paramsTest2=2';
    const SEARCH_IGNORE = 'ignoreMe=ignore';

    const cachedResponse = new Response('Injected Response');
    const cache = await caches.open(cacheNames.precache);
    await cache.put(new URL(`/?${SEARCH_1}&${SEARCH_2}`, location).href, cachedResponse);

    addFetchListener({
      ignoreURLParametersMatching: [/ignoreMe/],
    });
    precache([`/?${SEARCH_1}&${SEARCH_2}`]);

    const fetchEvent = new FetchEvent('fetch', {
      request: new Request(`/?${SEARCH_2}&${SEARCH_IGNORE}&${SEARCH_1}`),
    });
    const fetchResponse = await dispatchAndWaitForResponse(fetchEvent);

    expect(fetchResponse).to.exist;
    expect(await fetchResponse.text()).to.equal('Injected Response');
  });

  it(`should use the directoryIndex if the original request fails to match a cached URL`, async function() {
    const DIRECTORY_INDEX = 'test-index.html';

    const cachedResponse = new Response('Injected Response');
    const cache = await caches.open(cacheNames.precache);
    await cache.put(new URL(`/${DIRECTORY_INDEX}`, location).href, cachedResponse);

    addFetchListener({
      directoryIndex: DIRECTORY_INDEX,
    });
    precache([`/${DIRECTORY_INDEX}`]);

    const fetchEvent = new FetchEvent('fetch', {
      request: new Request(`/`),
    });

    const fetchResponse = await dispatchAndWaitForResponse(fetchEvent);

    expect(fetchResponse).to.exist;
    expect(await fetchResponse.text()).to.equal('Injected Response');
  });

  it(`should use the default directoryIndex of 'index.html'`, async function() {
    const DIRECTORY_INDEX = 'index.html';

    const cachedResponse = new Response('Injected Response');
    const cache = await caches.open(cacheNames.precache);
    await cache.put(new URL(`/${DIRECTORY_INDEX}`, location).href, cachedResponse);

    addFetchListener();
    precache([`/${DIRECTORY_INDEX}`]);

    const fetchEvent = new FetchEvent('fetch', {
      request: new Request(`/`),
    });

    const fetchResponse = await dispatchAndWaitForResponse(fetchEvent);

    expect(fetchResponse).to.exist;
    expect(await fetchResponse.text()).to.equal('Injected Response');
  });

  it(`should use the cleanURLs of 'about.html'`, async function() {
    const PRECACHED_FILE = 'about.html';

    const cachedResponse = new Response('Injected Response');
    const cache = await caches.open(cacheNames.precache);
    await cache.put(new URL(`/${PRECACHED_FILE}`, location).href, cachedResponse);

    addFetchListener();
    precache([`/${PRECACHED_FILE}`]);

    const fetchEvent = new FetchEvent('fetch', {
      request: new Request(`/about`),
    });
    const fetchResponse = await dispatchAndWaitForResponse(fetchEvent);

    expect(fetchResponse).to.exist;
    expect(await fetchResponse.text()).to.equal('Injected Response');
  });

  it(`should *not* use the cleanURLs of 'about.html' if set to false`, async function() {
    const PRECACHED_FILE = 'about.html';

    const cachedResponse = new Response('Injected Response');
    const cache = await caches.open(cacheNames.precache);
    await cache.put(new URL(`/${PRECACHED_FILE}`, location).href, cachedResponse);

    addFetchListener({
      cleanURLs: false,
    });
    precache([`/${PRECACHED_FILE}`]);

    const fetchEvent = new FetchEvent('fetch', {
      request: new Request(`/about`),
    });
    const fetchResponse = await dispatchAndWaitForResponse(fetchEvent);

    expect(fetchResponse).to.not.exist;
  });

  it(`should use a custom urlManipulation function`, async function() {
    const PRECACHED_FILE = '123.html';

    const cachedResponse = new Response('Injected Response');
    const cache = await caches.open(cacheNames.precache);
    await cache.put(new URL(`/${PRECACHED_FILE}`, location).href, cachedResponse);

    addFetchListener({
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
    const fetchResponse = await dispatchAndWaitForResponse(fetchEvent);

    expect(fetchResponse).to.exist;
    expect(await fetchResponse.text()).to.equal('Injected Response');
  });

  it(`should return null if there is no match`, async function() {
    const cachedResponse = new Response('Injected Response');
    const cache = await caches.open(cacheNames.precache);
    await cache.put(new URL(`/something-else.html`, location).href, cachedResponse);

    addFetchListener();
    precache([`/something-else.html`]);

    const fetchEvent = new FetchEvent('fetch', {
      request: new Request(`/`),
    });
    const fetchResponse = await dispatchAndWaitForResponse(fetchEvent);

    expect(fetchResponse).to.not.exist;
  });

  it(`should call fetch() if there's a missing entry for a URL that has been precached`, async function() {
    const stubResponse = new Response('From fetch()');
    const fetchStub = sandbox.stub(self, 'fetch').returns(stubResponse);

    const url = '/some-url';

    addFetchListener();

    // Because we're not triggering the install event in this test, a cache
    // entry for url won't be found, even though precache() is called.
    precache([url]);

    const fetchEvent = new FetchEvent('fetch', {
      request: new Request(url),
    });
    const fetchResponse = await dispatchAndWaitForResponse(fetchEvent);

    expect(fetchStub.callCount).to.equal(1);
    expect(await fetchResponse.text()).to.equal('From fetch()');
  });
});
