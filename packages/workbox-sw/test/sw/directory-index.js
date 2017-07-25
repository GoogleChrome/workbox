importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-sw');

describe(`Test Directory Index`, function() {
  it(`should throw on bad input`, function() {
    const badInputs = [
      '',
      {},
      [],
      123,
    ];
    badInputs.forEach((badInput) => {
      let caughtError;
      try {
        new WorkboxSW({
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
