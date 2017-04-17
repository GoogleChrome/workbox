importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sinon/pkg/sinon.js');
importScripts('/node_modules/sw-testing-helpers/build/browser/mocha-utils.js');

importScripts('/packages/sw-lib/build/sw-lib.min.js');

/* global goog, sinon */

const expect = self.chai.expect;
self.chai.should();
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Clients Claim parameter', function() {
  it('should fail on bad clientsClaim parameter', function() {
    const EXPECTED_ERROR_NAME = 'bad-clients-claim';
    const badInputs = [
      'Example',
      [],
      {},
      123,
    ];
    badInputs.forEach((badInput, index) => {
      let thrownError = null;
      try {
        new goog.SWLib({
          clientsClaim: badInput,
        });
        throw new Error(`Expected error to be thrown for inputs[${index}]: '${badInput}'.`);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).to.exist;
      thrownError.name.should.equal(EXPECTED_ERROR_NAME);
    });
  });

  it('should not claim when passed in false (clientsClaim)', function() {
    const claimSpy = sinon.spy(self.clients, 'claim');
    new goog.SWLib({
      clientsClaim: false,
    });

    return new Promise((resolve, reject) => {
      const activateEvent = new self.InstallEvent('activate');
      sinon.stub(activateEvent, 'waitUntil', (promiseChain) => {
        promiseChain.then(() => {
          claimSpy.restore();
        })
        .catch(() => {
          claimSpy.restore();
        })
        .then(() => {
          if (claimSpy.called === false) {
            resolve();
          } else {
            reject('Client.claim() was called.');
          }
        });
      });
      self.dispatchEvent(activateEvent);
    });
  });

  it('should claim when passed in true (clientsClaim)', function() {
    const claimSpy = sinon.spy(self.clients, 'claim');
    new goog.SWLib({
      clientsClaim: true,
    });
    return new Promise((resolve, reject) => {
      const activateEvent = new self.InstallEvent('activate');
      sinon.stub(activateEvent, 'waitUntil', (promiseChain) => {
        promiseChain.then(() => {
          claimSpy.restore();
        })
        .catch(() => {
          claimSpy.restore();
        })
        .then(() => {
          if (claimSpy.called === true) {
            resolve();
          } else {
            reject('Client.claim() was NOT called.');
          }
        });
      });
      self.dispatchEvent(activateEvent);
    });
  });
});
