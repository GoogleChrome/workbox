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

  it(`should accept custom index`, function() {
    const EXAMPLE_URL = '/example/url/';
    const DIRECTORY_INDEX = 'custom.html';

    let calledWithIndex = false;
    const claimStub = sinon.stub(Cache.prototype, 'match').callsFake((request) => {
      if (request === new URL(`${EXAMPLE_URL}${DIRECTORY_INDEX}`, self.location).toString()) {
        calledWithIndex = true;
      }
      return Promise.resolve(null);
    });
    stubs.push(claimStub);

    const workboxSW = new WorkboxSW({
      directoryIndex: DIRECTORY_INDEX,
    });
    workboxSW.precache([`${EXAMPLE_URL}${DIRECTORY_INDEX}`]);

    return new Promise((resolve, reject) => {
      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(EXAMPLE_URL),
      });
      fetchEvent.respondWith = (promiseChain) => {
        promiseChain.then(() => {
          if (calledWithIndex) {
            resolve();
          } else {
            reject('cache.match() was NOT called with directory index.');
          }
        });
      };
      self.dispatchEvent(fetchEvent);
    });
  });
});
