importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sinon/pkg/sinon.js');
importScripts('/node_modules/sw-testing-helpers/build/browser/mocha-utils.js');

importScripts('/__test/bundle/workbox-sw');

const expect = self.chai.expect;
self.chai.should();
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Skip Waiting parameter', function() {
  let stubs = [];

  afterEach(function() {
    stubs.forEach((stub) => {
      stub.restore();
    });
    stubs = [];
  });

  it('should fail on bad clientsClaim parameter', function() {
    const EXPECTED_ERROR_NAME = 'bad-skip-waiting';
    const badInputs = [
      'Example',
      [],
      {},
      123,
    ];
    badInputs.forEach((badInput, index) => {
      let thrownError = null;
      try {
        new WorkboxSW({
          skipWaiting: badInput,
        });
        throw new Error(`Expected error to be thrown for inputs[${index}]: '${badInput}'.`);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).to.exist;
      thrownError.name.should.equal(EXPECTED_ERROR_NAME);
    });
  });
});
