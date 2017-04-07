const proxyquire = require('proxyquire');
const clearRequire = require('clear-require');

const errors = require('../../src/lib/errors.js');

require('chai').should();

describe('src/lib/utils/get-file-hash.js', function() {
  const INJECTED_ERROR = new Error('Injected Error');

  it('should handle readFileSync Error', function() {
    const getFileHash = proxyquire('../../src/lib/utils/get-file-hash', {
      fs: {
        readFileSync: () => {
          throw INJECTED_ERROR;
        },
      },
    });

    let caughtError;
    try {
      getFileHash(null);
    } catch (err) {
      caughtError = err;
    }

    if (caughtError.message.indexOf(errors['unable-to-get-file-hash']) !== 0) {
      throw new Error('Unexpected error thrown. ' + caughtError.message);
    }
  });

  it('should return string for valid file', function() {
    const getFileHash = proxyquire('../../src/lib/utils/get-file-hash', {
      fs: {
        readFileSync: (file) => {
          if (file === 'fake-file.txt') {
            return Buffer.alloc(49);
          }
          throw new Error(`Unexpected file name: ${file}`);
        },
      },
    });

    const hash = getFileHash('fake-file.txt');
    if (!hash || typeof hash !== 'string' || hash.length === 0) {
      throw new Error(`Invalid hash value: '${hash}'`);
    }
  });

  it('should handle unexpected input', function() {
    // Proxyquire's old version is used if we don't clear it.
    clearRequire('../../src/lib/utils/get-file-hash');
    const getFileHash = require('../../src/lib/utils/get-file-hash');

    const inputTests = [
      null,
      undefined,
      '',
      [],
      {},
      true,
      false,
    ];
    inputTests.forEach((input) => {
      let caughtError;
      try {
        getFileHash(null);
      } catch (err) {
        caughtError = err;
      }

      if (caughtError.message.indexOf(errors['unable-to-get-file-hash']) !== 0) {
        throw new Error('Unexpected error thrown. ' + caughtError.message);
      }
    });
  });
});
