importScripts('setup.js');

describe('Test of the CacheFirst handler', function() {
  const CACHE_NAME = location.href;
  const COUNTER_URL = new URL('/__echo/counter', location).href;

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
});
