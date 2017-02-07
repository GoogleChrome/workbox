const proxyquire = require('proxyquire');
const path = require('path');
const cliHelper = require('./helpers/cli-test-helper.js');
const errors = require('../src/lib/errors.js');

require('chai').should();

describe('Copy SW Lib', function() {
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

  it('should handle file stream error', function() {
    this.timeout(5 * 1000);

    const fakeStream = {
      on: (eventName, cb) => {
        if (eventName === 'error') {
          setTimeout(() => cb(INJECTED_ERROR), 500);
        }
      },
      pipe: (stream) => stream,
    };
    const copySWLib = proxyquire('../src/lib/utils/copy-sw-lib', {
      mkdirp: {
        sync: () => {
          return;
        },
      },
      fs: {
        createReadStream: () => {
          return fakeStream;
        },
        createWriteStream: () => {
          return fakeStream;
        },
      },
    });

    cliHelper.startLogCapture();
    return copySWLib('fake-path/')
    .catch((caughtError) => {
      checkErrors(caughtError, 'unable-to-copy-sw-lib');
    });
  });

  it('should resolve with file name on file stream end', function() {
    this.timeout(5 * 1000);

    const fakeStream = {
      on: (eventName, cb) => {
        if (eventName === 'finish') {
          setTimeout(() => cb(), 500);
        }
      },
      pipe: (stream) => stream,
    };
    const copySWLib = proxyquire('../src/lib/utils/copy-sw-lib', {
      mkdirp: {
        sync: () => {
          return;
        },
      },
      fs: {
        createReadStream: () => {
          return fakeStream;
        },
        createWriteStream: () => {
          return fakeStream;
        },
      },
    });

    return copySWLib('fake-path/')
    .then((swLibPath) => {
      let pathSep = path.sep;
      if (path.sep === '\\') {
        pathSep = '\\\\';
      }
      const regexPattern = new RegExp(
        `fake-path${pathSep}sw-lib\.v\\d+\.\\d+\.\\d+\.min\.js`);
      if (!swLibPath.match(regexPattern)) {
        console.log('Regular expression: ' + regexPattern);
        throw new Error('Unexpected result from copying swlib: ' + swLibPath);
      }
    });
  });
});
