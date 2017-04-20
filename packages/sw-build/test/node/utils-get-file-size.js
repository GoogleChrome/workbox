const proxyquire = require('proxyquire');
const clearRequire = require('clear-require');

const errors = require('../../src/lib/errors.js');

require('chai').should();

describe('src/lib/utils/get-file-size.js', function() {
  const INJECTED_ERROR = new Error('Injected Error');

  it('should handle erroring statSync', function() {
    const getFileSize = proxyquire('../../src/lib/utils/get-file-size', {
      fs: {
        statSync: () => {
          throw INJECTED_ERROR;
        },
      },
    });

    let caughtError;
    try {
      getFileSize('fake-file.txt');
    } catch (err) {
      caughtError = err;
    }

    if (caughtError.message.indexOf(errors['unable-to-get-file-size']) !== 0) {
      throw new Error('Unexpected error thrown. ' + caughtError.message);
    }
  });

  it('should return null for non-files', function() {
    const getFileSize = proxyquire('../../src/lib/utils/get-file-size', {
      fs: {
        statSync: () => {
          return {
            isFile: () => {
              return false;
            },
          };
        },
      },
    });

    const fileSize = getFileSize('fake-file.txt');
    if (fileSize !== null) {
      throw new Error('For non-files, _getFileSize should return null.');
    }
  });

  it('should be able to get file details', function() {
    const injectedSize = 1234;
    const getFileSize = proxyquire('../../src/lib/utils/get-file-size', {
      fs: {
        statSync: () => {
          return {
            isFile: () => {
              return true;
            },
            size: 1234,
          };
        },
      },
    });

    const fileSize = getFileSize('fake-file.txt');
    if (fileSize !== injectedSize) {
      throw new Error(`_getFileSize should return ${injectedSize}.`);
    }
  });

  it('should handle unexpected input', function() {
    // Proxyquire's old version is used if we don't clear it.
    clearRequire('../../src/lib/utils/get-file-size');
    const getFileSize = require('../../src/lib/utils/get-file-size');

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
        getFileSize(null);
      } catch (err) {
        caughtError = err;
      }

      if (caughtError.message.indexOf(errors['unable-to-get-file-size']) !== 0) {
        throw new Error('Unexpected error thrown. ' + caughtError.message);
      }
    });
  });
});
