const proxyquire = require('proxyquire');

const cliHelper = require('./helpers/cli-test-helper');
const errors = require('../src/lib/errors.js');

require('chai').should();

describe('src/lib/utils/filter-files.js', function() {
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

  it('should handle failing mkdirp.sync', function() {
    const writeFileManifest = proxyquire('../src/lib/write-file-manifest', {
      mkdirp: (dirname, cb) => {
        cb(INJECTED_ERROR);
      },
    });

    cliHelper.startLogCapture();
    return writeFileManifest('fake-path/manifest-name.js')
    .catch((caughtError) => {
      checkErrors(caughtError, 'unable-to-make-manifest-directory');
    });
  });

  it('should handle fs.readFile error when checking template', function() {
    const writeFileManifest = proxyquire('../src/lib/write-file-manifest', {
      mkdirp: (dirname, cb) => {
        cb();
      },
      fs: {
        readFile: (pathname, encoding, cb) => {
          cb(INJECTED_ERROR);
        },
      },
    });

    cliHelper.startLogCapture();
    return writeFileManifest('fake-path/manifest-name.js')
    .catch((caughtError) => {
      checkErrors(caughtError, 'read-manifest-template-failure');
    });
  });

  it('should handle error when populating template', function() {
    const writeFileManifest = proxyquire('../src/lib/write-file-manifest', {
      'mkdirp': (dirname, cb) => {
        cb();
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
    return writeFileManifest('fake-path/manifest-name.js')
    .catch((caughtError) => {
      checkErrors(caughtError, 'populating-manifest-tmpl-failed');
    });
  });

  it('should handle error writing file', function() {
    const writeFileManifest = proxyquire('../src/lib/write-file-manifest', {
      'mkdirp': (dirname, cb) => {
        cb();
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
    return writeFileManifest('fake-path/manifest-name.js')
    .catch((caughtError) => {
      checkErrors(caughtError, 'manifest-file-write-failure');
    });
  });
});
