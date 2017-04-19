importScripts('setup.js');

describe('Test Directory Index', function() {
  const stubs = [];

  afterEach(function() {
    stubs.forEach((stub) => {
      stub.restore();
    });
  });

  it('should default to index.html', function() {
    const fetchStub = sinon.stub(self, 'fetch', (request) => {
      if (request.url === `${self.location.origin}/index.html`) {
        return Promise.resolve(new Response(``));
      }

      return Promise.reject(new Error('Injected error.'));
    });
    stubs.push(fetchStub);

    const requestWrapper = new goog.runtimeCaching.RequestWrapper();

    // Should only resolve for /index.html
    return requestWrapper.fetch({request: '/'});
  });

  it('should use custom directoryIndex', function() {
    const fetchStub = sinon.stub(self, 'fetch', (request) => {
      if (request.url === `${self.location.origin}/custom.html`) {
        return Promise.resolve(new Response(``));
      }

      return Promise.reject(new Error('Injected error.'));
    });
    stubs.push(fetchStub);

    const requestWrapper = new goog.runtimeCaching.RequestWrapper({
      directoryIndex: 'custom.html',
    });

    // Should only resolve for /index.html
    return requestWrapper.fetch({request: '/'});
  });

  it('should NOT use directoryIndex for non slash url', function() {
    let requestedUnexpectedUrl = null;
    let called = 0;
    const fetchStub = sinon.stub(self, 'fetch', (request) => {
      called++;
      if (request.url !== `${self.location.origin}/test.html`) {
        requestedUnexpectedUrl = request.url;
      }

      return Promise.reject(new Error('Injected error.'));
    });
    stubs.push(fetchStub);

    const requestWrapper = new goog.runtimeCaching.RequestWrapper();

    // Should only resolve for /index.html
    return requestWrapper.fetch({request: '/test.html'})
    .then(() => {
      throw new Error('This should have rejected.');
    }, () => {
      if (requestedUnexpectedUrl !== null) {
        throw new Error('Unexpected URL: ' + requestedUnexpectedUrl);
      }
      if (called !== 1) {
        throw new Error('fetch() called multiple times');
      }
    });
  });

  it('should not use directoryIndex if set to false', function() {
    let requestedUnexpectedUrl = null;
    let called = 0;
    const fetchStub = sinon.stub(self, 'fetch', (request) => {
      called++;
      if (request.url !== `${self.location.origin}/`) {
        requestedUnexpectedUrl = request.url;
      }

      return Promise.reject(new Error('Injected error.'));
    });
    stubs.push(fetchStub);

    const requestWrapper = new goog.runtimeCaching.RequestWrapper({
      directoryIndex: false,
    });

    // Should only resolve for /index.html
    return requestWrapper.fetch({request: '/'})
    .then(() => {
      throw new Error('This should have rejected.');
    }, () => {
      if (requestedUnexpectedUrl !== null) {
        throw new Error('Unexpected URL: ' + requestedUnexpectedUrl);
      }
      if (called !== 1) {
        throw new Error('fetch() called multiple times');
      }
    });
  });

  it('should not use directoryIndex if set to null', function() {
    let requestedUnexpectedUrl = null;
    let called = 0;
    const fetchStub = sinon.stub(self, 'fetch', (request) => {
      called++;
      if (request.url !== `${self.location.origin}/`) {
        requestedUnexpectedUrl = request.url;
      }

      return Promise.reject(new Error('Injected error.'));
    });
    stubs.push(fetchStub);

    const requestWrapper = new goog.runtimeCaching.RequestWrapper({
      directoryIndex: null,
    });

    // Should only resolve for /index.html
    return requestWrapper.fetch({request: '/'})
    .then(() => {
      throw new Error('This should have rejected.');
    }, () => {
      if (requestedUnexpectedUrl !== null) {
        throw new Error('Unexpected URL: ' + requestedUnexpectedUrl);
      }
      if (called !== 1) {
        throw new Error('fetch() called multiple times');
      }
    });
  });
});
