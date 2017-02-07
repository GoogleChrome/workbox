const proxyquire = require('proxyquire');
const cliHelper = require('./helpers/cli-test-helper.js');
const errors = require('../src/lib/errors.js');
const clearRequire = require('clear-require');

require('chai').should();

describe('src/lib/utils/get-file-size.js', function() {
  const INJECTED_ERROR = new Error('Injected Error');

  afterEach(function() {
    cliHelper.endLogCapture();
  });

  const checkErrors = (caughtError, errorCode, checkInjectedError) => {
    if (!caughtError) {
      throw new Error('Expected test to throw an error.');
    }

    const captured = cliHelper.endLogCapture();
    captured.consoleLogs.length.should.equal(0);
    captured.consoleWarns.length.should.equal(0);
    captured.consoleErrors.length.should.not.equal(0);

    let foundErrorMsg = false;
    let foundInjectedErrorMsg = false;
    captured.consoleErrors.forEach((errLog) => {
      if (errLog.indexOf(errors[errorCode]) !== -1) {
        foundErrorMsg = true;
      }
      if (errLog.indexOf(INJECTED_ERROR.message) !== -1) {
        foundInjectedErrorMsg = true;
      }
    });
    foundErrorMsg.should.equal(true);
    if (typeof checkInjectedError === 'undefined' ||
      checkInjectedError === true) {
      foundInjectedErrorMsg.should.equal(true);
    }
  };

  it('should handle erroring statSync', function() {
    const getFileSize = proxyquire('../src/lib/utils/get-file-size', {
      fs: {
        statSync: () => {
          throw INJECTED_ERROR;
        },
      },
    });

    cliHelper.startLogCapture();
    let caughtError;
    try {
      getFileSize('fake-file.txt');
    } catch (err) {
      caughtError = err;
    }

    checkErrors(caughtError, 'unable-to-get-file-size');
  });

  it('should return null for non-files', function() {
    const getFileSize = proxyquire('../src/lib/utils/get-file-size', {
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
    const getFileSize = proxyquire('../src/lib/utils/get-file-size', {
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
    clearRequire('../src/lib/utils/get-file-size');
    const getFileSize = require('../src/lib/utils/get-file-size');

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
      cliHelper.startLogCapture();
      let caughtError;
      try {
        getFileSize(null);
      } catch (err) {
        caughtError = err;
      }
      checkErrors(caughtError, 'unable-to-get-file-size', false);
    });
  });
});
