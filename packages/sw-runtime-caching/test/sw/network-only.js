importScripts('setup.js');

describe('Test of the NetworkOnly handler', function() {
  const CACHE_NAME = location.href;
  const REQUEST_WRAPPER = new goog.runtimeCaching.RequestWrapper({cacheName: CACHE_NAME});
  const NETWORK_ONLY = new goog.runtimeCaching.NetworkOnly({requestWrapper: REQUEST_WRAPPER, waitOnCache: true});
  const COUNTER_URL = new URL('/__echo/counter', location).href;

  let globalStubs = [];
  let cache;

  before(() => {
    return caches.delete(CACHE_NAME)
      .then(() => caches.open(CACHE_NAME))
      .then((openedCache) => cache = openedCache);
  });

  afterEach(function() {
    globalStubs.forEach((stub) => stub.restore());
    globalStubs = [];
  });

  it(`should return a response without adding anything to the cache when the network request is successful`, function() {
    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    return NETWORK_ONLY.handle({event})
      .then((response) => expect(response).to.be.truthy)
      .then(() => cache.keys())
      .then((keys) => expect(keys).to.be.empty);
  });

  it(`should reject when the network request fails`, function(done) {
    globalStubs.push(sinon.stub(self, 'fetch', () => {
      return Promise.reject(new Error());
    }));

    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    // This promise should reject, so call done() passing in an error string
    // if it resolves, and done() without an error if it rejects.
    NETWORK_ONLY.handle({event})
      .then(() => done(new Error('The promise should have rejected.')))
      .catch(() => done());
  });
});
