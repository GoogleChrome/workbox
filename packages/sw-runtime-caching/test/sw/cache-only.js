importScripts('setup.js');

describe('Test of the CacheOnly handler', function() {
  const CACHE_NAME = location.href;
  const COUNTER_URL = new URL('/__echo/counter', location).href;

  beforeEach(async function() {
    await caches.delete(CACHE_NAME);
  });

  it(`should not return a response when the cache isn't populated`, async function() {
    const requestWrapper = new goog.runtimeCaching.RequestWrapper(
      {cacheName: CACHE_NAME});
    const cacheOnly = new goog.runtimeCaching.CacheOnly({requestWrapper});

    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    const handleResponse = await cacheOnly.handle({event});

    expect(handleResponse).not.to.exist;
  });

  it(`should return the cached response when the cache is populated`, async function() {
    const requestWrapper = new goog.runtimeCaching.RequestWrapper(
      {cacheName: CACHE_NAME});
    const cacheOnly = new goog.runtimeCaching.CacheOnly({requestWrapper});

    const cachedResponse = new Response('response body');
    const cache = await caches.open(CACHE_NAME);
    await cache.put(COUNTER_URL, cachedResponse.clone());

    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    const handleResponse = await cacheOnly.handle({event});

    await expectSameResponseBodies(cachedResponse, handleResponse);
  });
});
