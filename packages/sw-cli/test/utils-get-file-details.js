const proxyquire = require('proxyquire');
const cliHelper = require('./helpers/cli-test-helper.js');
const errors = require('../src/lib/errors.js');

require('chai').should();

describe('src/lib/utils/get-file-details.js', function() {
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

  it('should handle glob sync error', function() {
    const getFileDetails = proxyquire('../src/lib/utils/get-file-details', {
      glob: {
        sync: () => {
          throw INJECTED_ERROR;
        },
      },
    });

    cliHelper.startLogCapture();
    let caughtError;
    try {
      getFileDetails('.', 'fake/glob/pattern/**/*');
    } catch (err) {
      caughtError = err;
    }

    checkErrors(caughtError, 'unable-to-glob-files');
  });

  it('should return array of file details, minus null values', function() {
    const EXAMPLE_DIRECTORY = './EXAMPLE_DIRECTORY';
    const INJECTED_SIZE = 1234;
    const INJECTED_HASH = 'example-hash';

    const OK_FILE_1 = 'ok.txt';
    const OK_FILE_2 = 'ok-2.txt';

    const getFileDetails = proxyquire('../src/lib/utils/get-file-details', {
      'glob': {
        sync: () => {
          return [
            OK_FILE_1,
            EXAMPLE_DIRECTORY,
            OK_FILE_2,
          ];
        },
      },
      './get-file-size': (value) => {
        if (value === EXAMPLE_DIRECTORY) {
          return null;
        }
        return INJECTED_SIZE;
      },
      './get-file-hash': (value) => {
        if (value === EXAMPLE_DIRECTORY) {
          // This should never be called with a directory.
          throw INJECTED_ERROR;
        }
        return INJECTED_HASH;
      },
    });

    const files = getFileDetails('.', 'fake/glob/pattern/**/*');

    if (files.length !== 2) {
      throw new Error('Directory not filtered from results');
    }

    files.forEach((fileDetails) => {
      fileDetails.size.should.equal(INJECTED_SIZE);
      fileDetails.hash.should.equal(INJECTED_HASH);
      if ([OK_FILE_1, OK_FILE_2].indexOf(fileDetails.file) === -1) {
        throw new Error('Unexpected Filename: ' + fileDetails.file);
      }
    });
  });
});
