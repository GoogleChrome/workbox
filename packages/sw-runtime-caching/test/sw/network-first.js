importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/packages/sw-runtime-caching/build/sw-runtime-caching.js',
  './helpers.js'
);

describe('Test of the NetworkFirst handler', function() {
  const CACHE_NAME = location.href;
  const REQUEST_WRAPPER = new goog.runtimeCaching.RequestWrapper({cacheName: CACHE_NAME});
  const NETWORK_FIRST = new goog.runtimeCaching.NetworkFirst({requestWrapper: REQUEST_WRAPPER, waitOnCache: true});
  const COUNTER_URL = new URL('/__echo/counter', location).href;

  let cache;
  let initialCachedResponse;

  before(() => {
    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    return caches.delete(CACHE_NAME)
      .then(() => caches.open(CACHE_NAME))
      .then((openedCache) => cache = openedCache)
      .then(() => NETWORK_FIRST.handle({event}))
      .then(() => cache.match(COUNTER_URL))
      .then((cachedResponse) => initialCachedResponse = cachedResponse);
  });

  it(`should add the initial response to the cache`, function() {
    expect(initialCachedResponse).to.exist;
  });

  it(`should return the cached response when the network request fails`, function() {
    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    let handleResponse;
    return NETWORK_FIRST.handle({event})
      .then((response) => handleResponse = response)
      .then(() => expectDifferentResponseBodies(initialCachedResponse, handleResponse))
      .then(() => cache.match(COUNTER_URL))
      .then((currentCachedResponse) => expectSameResponseBodies(currentCachedResponse, handleResponse));
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
});
