importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/packages/sw-runtime-caching/build/sw-runtime-caching.js',
  './helpers.js'
);

describe('Test of the CacheOnly handler', function() {
  const cacheName = location.href;
  const requestWrapper = new goog.runtimeCaching.RequestWrapper({cacheName});
  const cacheOnly = new goog.runtimeCaching.CacheOnly({requestWrapper});
  const url = new URL('/__echo/counter', location).href;

  let cache;

  before(() => {
    return caches.delete(cacheName)
      .then(() => caches.open(cacheName))
      .then((openedCache) => cache = openedCache);
  });

  it(`should not return a response when the cache isn't populated`, function() {
    const event = new FetchEvent('fetch', {request: new Request(url)});
    return cacheOnly.handle({event})
      .then((handleResponse) => expect(handleResponse).not.to.exist);
  });

  it(`should return the cached response when the cache is populated`, function() {
    const event = new FetchEvent('fetch', {request: new Request(url)});
    const cachedResponse = new Response('response body');

    return cache.put(url, cachedResponse.clone())
      .then(() => cacheOnly.handle({event}))
      .then((handleResponse) => expectSameResponseBodies(cachedResponse, handleResponse));
  });
});
