importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sinon/pkg/sinon.js');
importScripts('/node_modules/sw-testing-helpers/build/browser/mocha-utils.js');

importScripts('/packages/sw-lib/build/sw-lib.min.js');

/* global goog, sinon */

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

self.chai.should();
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Skip Waiting parameter - true', function() {
  let stubs = [];

  afterEach(function() {
    stubs.forEach((stub) => {
      stub.restore();
    });
    stubs = [];
  });

  it('should not claim when passed in true (clientsClaim)', function() {
    let called = false;
    const claimStub = sinon.stub(self, 'skipWaiting', () => {
      called = true;
      return Promise.resolve();
    });
    stubs.push(claimStub);
    new goog.SWLib({
      skipWaiting: true,
    });
    return new Promise((resolve, reject) => {
      const activateEvent = new Event('install');
      activateEvent.waitUntil = (promiseChain) => {
        promiseChain.then(() => {
          if (called === true) {
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
