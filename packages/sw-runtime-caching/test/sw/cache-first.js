importScripts('setup.js');

describe('Test of the CacheFirst handler', function() {
  const CACHE_NAME = location.href;
  const REQUEST_WRAPPER = new goog.runtimeCaching.RequestWrapper({cacheName: CACHE_NAME});
  const CACHE_FIRST = new goog.runtimeCaching.CacheFirst({requestWrapper: REQUEST_WRAPPER, waitOnCache: true});
  const COUNTER_URL = new URL('/__echo/counter', location).href;

  let cache;
  let initialCachedResponse;

  before(() => {
    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    return caches.delete(CACHE_NAME)
      .then(() => caches.open(CACHE_NAME))
      .then((openedCache) => cache = openedCache)
      .then(() => CACHE_FIRST.handle({event}))
      .then(() => cache.match(COUNTER_URL))
      .then((cachedResponse) => initialCachedResponse = cachedResponse);
  });

  it(`should add the initial response to the cache`, function() {
    expect(initialCachedResponse).to.exist;
  });

  it(`should reuse the initial cached response without updating the cache`, function() {
    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    return CACHE_FIRST.handle({event})
      .then((handleResponse) => expectSameResponseBodies(initialCachedResponse, handleResponse))
      .then(() => cache.match(COUNTER_URL))
      .then((currentCachedResponse) => expectSameResponseBodies(initialCachedResponse, currentCachedResponse));
  });
});
