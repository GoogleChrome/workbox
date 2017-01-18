const proxyquire = require('proxyquire');
const cliHelper = require('./helpers/cli-test-helper.js');
const errors = require('../src/lib/errors.js');

describe('Build Service Worker', function() {
  const INJECTED_ERROR = new Error('Injected Error');
  const globalStubs = [];

  afterEach(function() {
    cliHelper.endLogCapture();
    globalStubs.forEach((stub) => {
      stub.restore();
    });
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

  it('should handle failing mkdirp.sync', function() {
    const SWCli = proxyquire('../src/cli/index', {
      mkdirp: {
        sync: () => {
          throw INJECTED_ERROR;
        },
      },
    });

    cliHelper.startLogCapture();
    const cli = new SWCli();
    return cli._buildServiceWorker(
      'fake-path/sw.js',
      'fake-path/manifest.js',
      'fake-path/sw-lib.min.js',
      'fake-path/')
    .catch((caughtError) => {
      checkErrors(caughtError, 'unable-to-make-sw-directory');
    });
  });

  it('should handle fs.readFile error when checking template', function() {
    const SWCli = proxyquire('../src/cli/index', {
      mkdirp: {
        sync: () => {
          return;
        },
      },
      fs: {
        readFile: (pathname, encoding, cb) => {
          cb(INJECTED_ERROR);
        },
      },
    });

    cliHelper.startLogCapture();
    const cli = new SWCli();
    return cli._buildServiceWorker(
      'fake-path/sw.js',
      'fake-path/manifest.js',
      'fake-path/sw-lib.min.js',
      'fake-path/')
    .catch((caughtError) => {
      checkErrors(caughtError, 'read-sw-template-failure');
    });
  });

  it('should handle error when populating template', function() {
    const SWCli = proxyquire('../src/cli/index', {
      'mkdirp': {
        sync: () => {
          return;
        },
      },
      'fs': {
        readFile: (pathname, encoding, cb) => {
          cb(null, 'Injected Template');
        },
      },
      'lodash.template': () => {
        throw INJECTED_ERROR;
      },
    });

    cliHelper.startLogCapture();
    const cli = new SWCli();
    return cli._buildServiceWorker(
      'fake-path/sw.js',
      'fake-path/manifest.js',
      'fake-path/sw-lib.min.js',
      'fake-path/')
    .catch((caughtError) => {
      checkErrors(caughtError, 'populating-sw-tmpl-failed');
    });
  });

  it('should handle error writing file', function() {
    const SWCli = proxyquire('../src/cli/index', {
      'mkdirp': {
        sync: () => {
          return;
        },
      },
      'fs': {
        readFile: (pathname, encoding, cb) => {
          cb(null, 'Injected Template');
        },
        writeFile: (filepath, stringToWrite, cb) => {
          cb(INJECTED_ERROR);
        },
      },
      'lodash.template': () => {
        return () => {
          return 'Injected populated template.';
        };
      },
    });

    cliHelper.startLogCapture();
    const cli = new SWCli();
    return cli._buildServiceWorker(
      'fake-path/sw.js',
      'fake-path/manifest.js',
      'fake-path/sw-lib.min.js',
      'fake-path/')
    .catch((caughtError) => {
      checkErrors(caughtError, 'sw-write-failure');
    });
  });
});
