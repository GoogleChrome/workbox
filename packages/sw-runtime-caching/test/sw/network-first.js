importScripts('setup.js');

describe('Test of the NetworkFirst handler', function() {
  const CACHE_NAME = location.href;
  const REQUEST_WRAPPER = new goog.runtimeCaching.RequestWrapper({cacheName: CACHE_NAME});
  const NETWORK_FIRST = new goog.runtimeCaching.NetworkFirst({requestWrapper: REQUEST_WRAPPER, waitOnCache: true});
  const COUNTER_URL = new URL('/__echo/counter', location).href;

  let globalStubs = [];
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
    return NETWORK_FIRST.handle({event})
      .then((response) => handleResponse = response)
      .then(() => expectSameResponseBodies(initialCachedResponse, handleResponse))
      .then(() => cache.match(COUNTER_URL))
      .then((currentCachedResponse) => expectSameResponseBodies(currentCachedResponse, initialCachedResponse));
  });

  it(`should return the cached response if the network request times out`, function() {
    const networkTimeoutSeconds = 0.1;

    globalStubs.push(sinon.stub(self, 'fetch', () => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(new Response('')), (networkTimeoutSeconds * 1000) + 100);
      });
    }));

    const networkFirstWithTimeout = new goog.runtimeCaching.NetworkFirst(
      {requestWrapper: REQUEST_WRAPPER, waitOnCache: true, networkTimeoutSeconds});
    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    return networkFirstWithTimeout.handle({event})
      .then((handleResponse) => expectSameResponseBodies(initialCachedResponse, handleResponse));
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

  it(`should return the network response and update the cache when the network request succeeds`, function() {
    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    let handleResponse;
    return NETWORK_FIRST.handle({event})
      .then((response) => handleResponse = response)
      .then(() => expectDifferentResponseBodies(initialCachedResponse, handleResponse))
      .then(() => cache.match(COUNTER_URL))
      .then((currentCachedResponse) => expectSameResponseBodies(currentCachedResponse, handleResponse));
  });
});
