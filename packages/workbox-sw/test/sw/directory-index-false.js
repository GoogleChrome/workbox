importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sinon/pkg/sinon-no-sourcemaps.js');
importScripts('/node_modules/sw-testing-helpers/build/browser/mocha-utils.js');
importScripts('/__test/bundle/workbox-sw');

/* global goog, sinon */

self.chai.should();
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test Directory Index', function() {
  let stubs = [];

  afterEach(function() {
    stubs.forEach((stub) => {
      stub.restore();
    });
    stubs = [];
  });

  it('should do nothing if passing in false', function() {
    const EXAMPLE_URL = '/example/url/';

    let calledWithIndex = false;
    const claimStub = sinon.stub(Cache.prototype, 'match', (request) => {
      if (request === new URL(`${EXAMPLE_URL}index.html`, self.location).toString()) {
        calledWithIndex = true;
      }
      return Promise.resolve(null);
    });
    stubs.push(claimStub);

    const swlib = new goog.SWLib({
      directoryIndex: false,
    });
    swlib.precache([`${EXAMPLE_URL}index.html`]);
    swlib.router.registerRoute(EXAMPLE_URL, swlib.strategies.cacheFirst());

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
