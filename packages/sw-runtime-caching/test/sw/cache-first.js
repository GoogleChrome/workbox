importScripts('setup.js');

describe('Test of the CacheFirst handler', function() {
  const CACHE_NAME = location.href;
  const COUNTER_URL = new URL('/__echo/counter', location).href;
  const CROSS_ORIGIN_COUNTER_URL = generateCrossOriginUrl(COUNTER_URL);

  beforeEach(async function() {
    await caches.delete(CACHE_NAME);
  });

  it(`should add the initial response to the cache, and then reuse it without updating the cache`, async function() {
    const requestWrapper = new goog.runtimeCaching.RequestWrapper(
      {cacheName: CACHE_NAME});
    const cacheFirst = new goog.runtimeCaching.CacheFirst(
      {requestWrapper, waitOnCache: true});

    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    const firstHandleResponse = await cacheFirst.handle({event});

    const cache = await caches.open(CACHE_NAME);
    const firstCachedResponse = await cache.match(COUNTER_URL);

    await expectSameResponseBodies(firstHandleResponse, firstCachedResponse);

    const secondHandleResponse = await cacheFirst.handle({event});
    const secondCachedResponse = await cache.match(COUNTER_URL);

    await expectSameResponseBodies(firstCachedResponse, secondHandleResponse);
    await expectSameResponseBodies(firstCachedResponse, secondCachedResponse);
  });

  it(`should not update the cache with an the opaque cross-origin network response by default`, async function() {
    const requestWrapper = new goog.runtimeCaching.RequestWrapper(
      {cacheName: CACHE_NAME});
    const cacheFirst = new goog.runtimeCaching.CacheFirst(
      {requestWrapper, waitOnCache: false});

    const event = new FetchEvent('fetch', {
      request: new Request(CROSS_ORIGIN_COUNTER_URL, {mode: 'no-cors'})});
    const handleResponse = await cacheFirst.handle({event});

    expect(handleResponse.type).to.eql('opaque');

    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(CROSS_ORIGIN_COUNTER_URL);

    expect(cachedResponse).to.be.undefined;
  });

  it(`should update the cache with an the opaque cross-origin network response when a cacheWillUpdate plugin returns true`, async function() {
    const cacheWillUpdate = {cacheWillUpdate: () => true};
    const requestWrapper = new goog.runtimeCaching.RequestWrapper({
      cacheName: CACHE_NAME,
      plugins: [cacheWillUpdate],
    });
    const cacheFirst = new goog.runtimeCaching.CacheFirst(
      {requestWrapper, waitOnCache: true});

    const event = new FetchEvent('fetch', {
      request: new Request(CROSS_ORIGIN_COUNTER_URL, {mode: 'no-cors'})});
    const handleResponse = await cacheFirst.handle({event});

    expect(handleResponse.type).to.eql('opaque');

    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(CROSS_ORIGIN_COUNTER_URL);

    expect(cachedResponse.type).to.eql('opaque');
  });
});
