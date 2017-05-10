importScripts('setup.js');

describe('Test of the NetworkFirst handler', function() {
  const CACHE_NAME = location.href;
  const COUNTER_URL = new URL('/__echo/counter', location).href;
  const CROSS_ORIGIN_COUNTER_URL = generateCrossOriginUrl(COUNTER_URL);

  let globalStubs = [];

  beforeEach(async function() {
    await caches.delete(CACHE_NAME);
  });

  afterEach(function() {
    globalStubs.forEach((stub) => stub.restore());
    globalStubs = [];
  });

  it(`should add the network response to the cache`, async function() {
    const requestWrapper = new goog.runtimeCaching.RequestWrapper(
      {cacheName: CACHE_NAME});
    const networkFirst = new goog.runtimeCaching.NetworkFirst(
      {requestWrapper, waitOnCache: true});

    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    const handleResponse = await networkFirst.handle({event});

    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(COUNTER_URL);

    await expectSameResponseBodies(cachedResponse, handleResponse);
  });

  it(`should return the cached response and not update the cache when the network request fails`, async function() {
    globalStubs.push(sinon.stub(self, 'fetch').throws('NetworkError'));

    const requestWrapper = new goog.runtimeCaching.RequestWrapper(
      {cacheName: CACHE_NAME});
    const networkFirst = new goog.runtimeCaching.NetworkFirst(
      {requestWrapper, waitOnCache: true});

    const initialCachedResponse = new Response('response body');
    const cache = await caches.open(CACHE_NAME);
    await cache.put(COUNTER_URL, initialCachedResponse.clone());

    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    const handleResponse = await networkFirst.handle({event});

    await expectSameResponseBodies(initialCachedResponse, handleResponse);

    const currentCachedResponse = await cache.match(COUNTER_URL);

    await expectSameResponseBodies(initialCachedResponse, currentCachedResponse);
  });

  it(`should return the cached response if the network request times out`, async function() {
    const networkTimeoutSeconds = 0.1;

    globalStubs.push(sinon.stub(self, 'fetch', () => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(new Response('')), (networkTimeoutSeconds * 1000) + 5);
      });
    }));

    const requestWrapper = new goog.runtimeCaching.RequestWrapper(
      {cacheName: CACHE_NAME});
    const networkFirstWithTimeout = new goog.runtimeCaching.NetworkFirst(
      {requestWrapper, waitOnCache: true, networkTimeoutSeconds});

    const initialCachedResponse = new Response('response body');
    const cache = await caches.open(CACHE_NAME);
    await cache.put(COUNTER_URL, initialCachedResponse.clone());

    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    const handleResponse = await networkFirstWithTimeout.handle({event});

    await expectSameResponseBodies(initialCachedResponse, handleResponse);
  });

  it(`should throw when NetworkFirst() is called with an invalid networkTimeoutSeconds parameter`, function() {
    let thrownError = null;
    try {
      new goog.runtimeCaching.NetworkFirst({networkTimeoutSeconds: 'invalid'});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('isType');
  });

  it(`should return the network response and update the cache when the network request succeeds`, async function() {
    const requestWrapper = new goog.runtimeCaching.RequestWrapper(
      {cacheName: CACHE_NAME});
    const networkFirst = new goog.runtimeCaching.NetworkFirst(
      {requestWrapper, waitOnCache: true});

    const initialCachedResponse = new Response('response body');
    const cache = await caches.open(CACHE_NAME);
    await cache.put(COUNTER_URL, initialCachedResponse.clone());

    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    const handleResponse = await networkFirst.handle({event});

    await expectDifferentResponseBodies(initialCachedResponse, handleResponse);

    const currentCachedResponse = await cache.match(COUNTER_URL);

    await expectSameResponseBodies(handleResponse, currentCachedResponse);
  });

  it(`should update the cache with an the opaque cross-origin network response`, async function() {
    const requestWrapper = new goog.runtimeCaching.RequestWrapper(
      {cacheName: CACHE_NAME});
    const networkFirst = new goog.runtimeCaching.NetworkFirst(
      {requestWrapper, waitOnCache: true});

    const cache = await caches.open(CACHE_NAME);

    const event = new FetchEvent('fetch',
      {request: new Request(CROSS_ORIGIN_COUNTER_URL, {mode: 'no-cors'})});
    const handleResponse = await networkFirst.handle({event});

    expect(handleResponse.type).to.eql('opaque');

    const cachedResponse = await cache.match(CROSS_ORIGIN_COUNTER_URL);

    expect(cachedResponse.type).to.eql('opaque');
  });
});
