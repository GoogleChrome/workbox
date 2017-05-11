importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sinon/pkg/sinon-no-sourcemaps.js');
importScripts('/node_modules/sw-testing-helpers/build/browser/mocha-utils.js');
importScripts('/__test/bundle/workbox-sw');

/* global goog */

self.chai.should();
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test Directory Index', function() {
  it('should throw on bad input', function() {
    const badInputs = [
      '',
      {},
      [],
      123,
    ];
    badInputs.forEach((badInput) => {
      let caughtError;
      try {
        new goog.SWLib({
          directoryIndex: badInput,
        });
        throw new Error('Expected error to be thrown.');
      } catch (err) {
        caughtError = err;
      }
      if (caughtError.name !== 'bad-directory-index') {
        console.error(caughtError);
        throw new Error('Unexpected error thrown.');
      }
    });
  });
});
