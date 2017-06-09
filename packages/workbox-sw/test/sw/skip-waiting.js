importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-sw');

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
