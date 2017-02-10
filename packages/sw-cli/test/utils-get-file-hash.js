const proxyquire = require('proxyquire');
const cliHelper = require('./helpers/cli-test-helper.js');
const errors = require('../src/lib/errors.js');
const clearRequire = require('clear-require');

require('chai').should();

describe('src/lib/utils/get-file-hash.js', function() {
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

  it('should handle readFileSync Error', function() {
    const getFileHash = proxyquire('../src/lib/utils/get-file-hash', {
      fs: {
        readFileSync: () => {
          throw INJECTED_ERROR;
        },
      },
    });

    cliHelper.startLogCapture();
    let caughtError;
    try {
      getFileHash(null);
    } catch (err) {
      caughtError = err;
    }

    checkErrors(caughtError, 'unable-to-get-file-hash');
  });

  it('should return string for valid file', function() {
    const getFileHash = proxyquire('../src/lib/utils/get-file-hash', {
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
    clearRequire('../src/lib/utils/get-file-hash');
    const getFileHash = require('../src/lib/utils/get-file-hash');

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
        getFileHash(null);
      } catch (err) {
        caughtError = err;
      }
      checkErrors(caughtError, 'unable-to-get-file-hash', false);
    });
  });
});
