const proxyquire = require('proxyquire');
const cliHelper = require('./helpers/cli-test-helper.js');
const errors = require('../src/lib/errors.js');

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
    const SWCli = proxyquire('../src/cli/index', {
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
    const cli = new SWCli();
    return cli._copySWLibFile('fake-path/')
    .catch((caughtError) => {
      checkErrors(caughtError, 'unable-to-copy-sw-lib');
    });
  });
});
