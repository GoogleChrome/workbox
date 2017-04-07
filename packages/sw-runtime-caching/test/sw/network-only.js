importScripts('setup.js');

describe('Test of the NetworkOnly handler', function() {
  const CACHE_NAME = location.href;
  const COUNTER_URL = new URL('/__echo/counter', location).href;

  let globalStubs = [];

  beforeEach(async function() {
    await caches.delete(CACHE_NAME);
  });

  afterEach(function() {
    globalStubs.forEach((stub) => stub.restore());
    globalStubs = [];
  });

  it(`should return a response without adding anything to the cache when the network request is successful`, async function() {
    const requestWrapper = new goog.runtimeCaching.RequestWrapper(
      {cacheName: CACHE_NAME});
    const networkOnly = new goog.runtimeCaching.NetworkOnly(
      {requestWrapper, waitOnCache: true});

    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    const handleResponse = await networkOnly.handle({event});
    expect(handleResponse).to.be.instanceOf(Response);

    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    expect(keys).to.be.empty;
  });

  it(`should reject when the network request fails`, function(done) {
    const message = 'expected error';

    const requestWrapper = new goog.runtimeCaching.RequestWrapper(
      {cacheName: CACHE_NAME});
    const networkOnly = new goog.runtimeCaching.NetworkOnly(
      {requestWrapper, waitOnCache: true});

    globalStubs.push(sinon.stub(self, 'fetch', () => {
      throw new Error(message);
    }));

    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    // This promise should reject, so call done() passing in an error string
    // if it resolves, and done() without an error if it rejects.
    networkOnly.handle({event})
      .then(() => done(new Error('The promise should have rejected.')))
      .catch((error) => {
        if (error.message === message) {
          done();
        } else {
          done(error);
        }
      });
  });
});
