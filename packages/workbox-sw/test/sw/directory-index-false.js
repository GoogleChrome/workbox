importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-sw');

describe(`Test Directory Index`, function() {
  let stubs = [];

  afterEach(function() {
    stubs.forEach((stub) => {
      stub.restore();
    });
    stubs = [];
  });

  it(`should do nothing if passing in false`, function() {
    const EXAMPLE_URL = '/example/url/';

    let calledWithIndex = false;
    const claimStub = sinon.stub(Cache.prototype, 'match').callsFake((request) => {
      if (request === new URL(`${EXAMPLE_URL}index.html`, self.location).toString()) {
        calledWithIndex = true;
      }
      return Promise.resolve(null);
    });
    stubs.push(claimStub);

    const workboxSW = new WorkboxSW({
      directoryIndex: false,
    });
    workboxSW.precache([`${EXAMPLE_URL}index.html`]);
    workboxSW.router.registerRoute(EXAMPLE_URL, workboxSW.strategies.cacheFirst());

    return new Promise((resolve, reject) => {
      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(EXAMPLE_URL),
      });
      fetchEvent.respondWith = (promiseChain) => {
        promiseChain.then(() => {
          if (!calledWithIndex) {
            resolve();
          } else {
            reject('cache.match() was called with directory index when it shouldnt have been.');
          }
        });
      };
      self.dispatchEvent(fetchEvent);
    });
  });
});
