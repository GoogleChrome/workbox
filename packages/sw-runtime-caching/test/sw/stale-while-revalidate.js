importScripts('setup.js');

describe('Test of the StaleWhileRevalidate handler', function() {
  const CACHE_NAME = location.href;
  const REQUEST_WRAPPER = new goog.runtimeCaching.RequestWrapper({cacheName: CACHE_NAME});
  const STALE_WHILE_REVALIDATE = new goog.runtimeCaching.StaleWhileRevalidate({requestWrapper: REQUEST_WRAPPER, waitOnCache: true});
  const COUNTER_URL = new URL('/__echo/counter', location).href;

  let globalStubs = [];
  let cache;
  let initialCachedResponse;

  before(() => {
    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    return caches.delete(CACHE_NAME)
      .then(() => caches.open(CACHE_NAME))
      .then((openedCache) => cache = openedCache)
      .then(() => STALE_WHILE_REVALIDATE.handle({event}))
      .then(() => cache.match(COUNTER_URL))
      .then((cachedResponse) => initialCachedResponse = cachedResponse);
  });

  afterEach(function() {
    globalStubs.forEach((stub) => stub.restore());
    globalStubs = [];
  });

  it(`should add the initial response to the cache`, function() {
    expect(initialCachedResponse).to.exist;
  });

  it(`should return the cached response and not update the cache when the network request fails`, function() {
    globalStubs.push(sinon.stub(self, 'fetch').throws('NetworkError'));

    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    let handleResponse;
    return STALE_WHILE_REVALIDATE.handle({event})
      .then((response) => handleResponse = response)
      .then(() => expectSameResponseBodies(initialCachedResponse, handleResponse))
      .then(() => cache.match(COUNTER_URL))
      .then((currentCachedResponse) => expectSameResponseBodies(currentCachedResponse, initialCachedResponse));
  });

  it(`should return the cached response and update the cache when the network request succeeds`, function() {
    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    let handleResponse;
    return STALE_WHILE_REVALIDATE.handle({event})
      .then((response) => handleResponse = response)
      .then(() => expectSameResponseBodies(initialCachedResponse, handleResponse))
      .then(() => cache.match(COUNTER_URL))
      .then((currentCachedResponse) => expectDifferentResponseBodies(currentCachedResponse, initialCachedResponse));
  });
});
