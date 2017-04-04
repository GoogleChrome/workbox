importScripts('setup.js');

describe('Test of the CacheFirst handler', function() {
  const cacheName = location.href;
  const requestWrapper = new goog.runtimeCaching.RequestWrapper({cacheName});
  const cacheFirst = new goog.runtimeCaching.CacheFirst({requestWrapper, waitOnCache: true});
  const url = new URL('/__echo/counter', location).href;

  let cache;
  let initialCachedResponse;

  before(() => {
    const event = new FetchEvent('fetch', {request: new Request(url)});
    return caches.delete(cacheName)
      .then(() => caches.open(cacheName))
      .then((openedCache) => cache = openedCache)
      .then(() => cacheFirst.handle({event}))
      .then(() => cache.match(url))
      .then((cachedResponse) => initialCachedResponse = cachedResponse);
  });

  it(`should add the initial response to the cache`, function() {
    expect(initialCachedResponse).to.exist;
  });

  it(`should reuse the initial cached response without updating the cache`, function() {
    const event = new FetchEvent('fetch', {request: new Request(url)});
    return cacheFirst.handle({event})
      .then((handleResponse) => expectSameResponseBodies(initialCachedResponse, handleResponse))
      .then(() => cache.match(url))
      .then((currentCachedResponse) => expectSameResponseBodies(initialCachedResponse, currentCachedResponse));
  });
});
