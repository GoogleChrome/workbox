importScripts('setup.js');

describe('Test of the RequestWrapper class', function() {
  const CACHE_NAME = location.href;
  const CACHE_WILL_UPDATE_PLUGIN = {cacheWillUpdate: () => {}};
  const CACHE_WILL_MATCH_PLUGIN = {cacheWillMatch: () => {}};
  const CACHED_URL = '/cached';

  let globalStubs = [];

  before(() => {
    return caches.delete(CACHE_NAME)
      .then(() => caches.open(CACHE_NAME))
      .then((cache) => cache.put(CACHED_URL, new Response('')));
  });

  afterEach(function() {
    globalStubs.forEach((stub) => stub.restore());
    globalStubs = [];
  });

  it(`should throw when RequestWrapper() is called with an invalid cacheName parameter`, function() {
    let thrownError = null;
    try {
      new goog.runtimeCaching.RequestWrapper({cacheName: []});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('isType');
  });

  it(`should throw when RequestWrapper() is called with an invalid fetchOptions parameter`, function() {
    let thrownError = null;
    try {
      new goog.runtimeCaching.RequestWrapper({fetchOptions: 'invalid'});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('isType');
  });

  it(`should throw when RequestWrapper() is called with an invalid matchOptions parameter`, function() {
    let thrownError = null;
    try {
      new goog.runtimeCaching.RequestWrapper({matchOptions: 'invalid'});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('isType');
  });

  it(`should throw when RequestWrapper() is called with an invalid plugins parameter`, function() {
    let thrownError = null;
    try {
      new goog.runtimeCaching.RequestWrapper({plugins: [1]});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('isArrayOfType');
  });

  it(`should throw when RequestWrapper() is called with multiple cacheWillUpdate plugins`, function() {
    let thrownError = null;
    try {
      new goog.runtimeCaching.RequestWrapper({plugins: [
        CACHE_WILL_UPDATE_PLUGIN, CACHE_WILL_UPDATE_PLUGIN]});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('multiple-cache-will-update-plugins');
  });

  it(`should throw when RequestWrapper() is called with multiple cacheWillMatch plugins`, function() {
    let thrownError = null;
    try {
      new goog.runtimeCaching.RequestWrapper({plugins: [
        CACHE_WILL_MATCH_PLUGIN, CACHE_WILL_MATCH_PLUGIN]});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('multiple-cache-will-match-plugins');
  });

  it(`should return an valid Cache instance when getCache() is called`, function() {
    const requestWrapper = new goog.runtimeCaching.RequestWrapper();
    requestWrapper.getCache().then((cache) => expect(cache).to.be.instanceOf(Cache));
  });

  it(`should find an entry in the correct cache when match() is called`, function() {
    const requestWrapper = new goog.runtimeCaching.RequestWrapper({cacheName: CACHE_NAME});
    return requestWrapper.match({request: CACHED_URL})
      .then((response) => expect(response).to.be.instanceOf(Response));
  });

  it(`should fulfill the match() promise with the value returned by a cacheWillMatch callback`, function() {
    const testResponse = new Response('test');
    const cacheWillMatchPlugin = {cacheWillMatch: () => testResponse};
    const requestWrapper = new goog.runtimeCaching.RequestWrapper({
      cacheName: CACHE_NAME,
      plugins: [cacheWillMatchPlugin],
    });
    return requestWrapper.match({request: CACHED_URL})
      .then((response) => expect(response).to.eql(testResponse));
  });

  it(`should return a response from the network when fetch() is called`, function() {
    const requestWrapper = new goog.runtimeCaching.RequestWrapper();
    return requestWrapper.fetch({request: CACHED_URL})
      .then((response) => expect(response).to.be.instanceOf(Response));
  });

  it(`should allow a requestWillFetch to modify the request when fetch() is called`, function() {
    const fetchStub = sinon.stub(self, 'fetch');
    globalStubs.push(fetchStub);

    const testRequest = new Request('/test');
    const requestWillFetch = {requestWillFetch: () => Promise.resolve(testRequest)};
    const requestWrapper = new goog.runtimeCaching.RequestWrapper({
      plugins: [requestWillFetch],
    });
    return requestWrapper.fetch({request: CACHED_URL})
      .then(() => expect(fetchStub.getCall(0).args[0]).to.eql(testRequest));
  });

  it(`should call fetchDidFail when fetch() is called and the network request fails`, function(done) {
    globalStubs.push(sinon.stub(self, 'fetch').throws('NetworkError'));

    const fetchDidFailSpy = sinon.spy();
    const fetchDidFail = {fetchDidFail: fetchDidFailSpy};
    const requestWrapper = new goog.runtimeCaching.RequestWrapper({
      plugins: [fetchDidFail],
    });
    // This promise should reject, so call done() passing in an error string
    // if it resolves, and done() without an error if it rejects.
    requestWrapper.fetch({request: CACHED_URL})
      .then(() => done(new Error('The promise should have rejected.')))
      .catch(() => {
        expect(fetchDidFailSpy.firstCall.args[0].request).to.be.instanceOf(Request);
        done();
      });
  });

  it(`should cache the response when fetchAndCache() is called and cacheWillUpdate returns true`, function() {
    const cacheWillUpdate = {cacheWillUpdate: () => true};
    const requestWrapper = new goog.runtimeCaching.RequestWrapper({
      plugins: [cacheWillUpdate],
    });

    return requestWrapper.getCache().then((cache) => {
      const cachePutStub = sinon.stub(cache, 'put');
      globalStubs.push(cachePutStub);

      return requestWrapper.fetchAndCache({request: CACHED_URL, waitOnCache: true})
        .then(() => expect(cachePutStub.firstCall.args[0]).to.eql(CACHED_URL))
        .then(() => expect(cachePutStub.firstCall.args[1]).to.be.instanceOf(Response));
    });
  });

  it(`should reject without caching the response when fetchAndCache() is called and cacheWillUpdate returns false`, function(done) {
    const cacheWillUpdate = {cacheWillUpdate: () => false};
    const requestWrapper = new goog.runtimeCaching.RequestWrapper({
      plugins: [cacheWillUpdate],
    });

    requestWrapper.getCache().then((cache) => {
      const cachePutStub = sinon.stub(cache, 'put');
      globalStubs.push(cachePutStub);

      // This promise should reject, so call done() passing in an error string
      // if it resolves, and done() without an error if it rejects.
      requestWrapper.fetchAndCache({request: CACHED_URL, waitOnCache: true})
        .then(() => done(new Error('The promise should have rejected.')))
        .catch((error) => {
          expect(cachePutStub.firstCall).to.be.null;
          expect(error.name).to.eql('invalid-reponse-for-caching');
          done();
        });
    });
  });
});
