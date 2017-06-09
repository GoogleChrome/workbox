importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-sw');

/**
 *
 *
 * This is a seperate test because adding activate and install events and
 * relying on it results in multiple event listeners being added and responding
 * to test cases.
 *
 * Seperating into files results in custom scopes and isolation for each test.
 *
 *
 */

describe('Skip Waiting parameter - false', function() {
  let stubs = [];

  afterEach(function() {
    stubs.forEach((stub) => {
      stub.restore();
    });
    stubs = [];
  });

  it('should not claim when passed in false (clientsClaim)', function() {
    let called = false;
    const claimStub = sinon.stub(self, 'skipWaiting').callsFake(() => {
      called = true;
      return Promise.resolve();
    });
    stubs.push(claimStub);
    new WorkboxSW({
      skipWaiting: false,
    });
    return new Promise((resolve, reject) => {
      const activateEvent = new Event('install');
      activateEvent.waitUntil = (promiseChain) => {
        promiseChain.then(() => {
          if (called === false) {
            resolve();
          } else {
            reject('self.skipWaiting() was called.');
          }
        });
      };
      self.dispatchEvent(activateEvent);
    });
  });
});
