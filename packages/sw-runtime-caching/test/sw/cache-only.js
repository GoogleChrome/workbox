importScripts('setup.js');

describe('Test of the CacheOnly handler', function() {
  const CACHE_NAME = location.href;
  const REQUEST_WRAPPER = new goog.runtimeCaching.RequestWrapper({cacheName: CACHE_NAME});
  const CACHE_ONLY = new goog.runtimeCaching.CacheOnly({requestWrapper: REQUEST_WRAPPER});
  const COUNTER_URL = new URL('/__echo/counter', location).href;

  let cache;

  before(() => {
    return caches.delete(CACHE_NAME)
      .then(() => caches.open(CACHE_NAME))
      .then((openedCache) => cache = openedCache);
  });

  it(`should not return a response when the cache isn't populated`, function() {
    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    return CACHE_ONLY.handle({event})
      .then((handleResponse) => expect(handleResponse).not.to.exist);
  });

  it(`should return the cached response when the cache is populated`, function() {
    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    const cachedResponse = new Response('response body');

    return cache.put(COUNTER_URL, cachedResponse.clone())
      .then(() => CACHE_ONLY.handle({event}))
      .then((handleResponse) => expectSameResponseBodies(cachedResponse, handleResponse));
  });
});
