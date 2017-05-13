const proxyquire = require('proxyquire');
const cliHelper = require('../utils/cli-test-helper.js');
const errors = require('../../src/lib/errors');

describe('Test Get Config', function() {
  it('should be able to handle readFile error', function() {
    const getConfig = proxyquire('../../src/lib/utils/get-config', {
      fs: {
        readFile: (path, cb) => {
          cb(new Error('Injected Error'));
        },
      },
    });
    return getConfig()
    .then((config) => {
      if (config !== null) {
        throw new Error('Unexpected response from getConfig.');
      }
    });
  });

  it('should handle non-json config file', function() {
    const getConfig = proxyquire('../../src/lib/utils/get-config', {
      fs: {
        readFile: (path, cb) => {
          cb(null, 'Not JSON at all.');
        },
      },
    });

    cliHelper.startLogCapture();
    return getConfig()
    .then((config) => {
      if (config !== null) {
        throw new Error('Unexpected response from getConfig.');
      }

      const captured = cliHelper.endLogCapture();
      captured.consoleLogs.length.should.equal(0);
      captured.consoleWarns.length.should.equal(1);
      captured.consoleErrors.length.should.equal(0);

      let foundWarningMsg = false;
      captured.consoleWarns.forEach((errLog) => {
        if (errLog.indexOf(errors['config-not-json']) !== -1) {
          foundWarningMsg = true;
        }
      });
      if (!foundWarningMsg) {
        console.log('Warnings: ', captured.consoleWarns);
        throw new Error('Unexpected warning message printed');
      }
    });
  });

  it('should handle json config file', function() {
    const data = {
      example: 'Hi.',
    };
    const getConfig = proxyquire('../../src/lib/utils/get-config', {
      fs: {
        readFile: (path, cb) => {
          cb(null, JSON.stringify(data));
        },
      },
    });

    cliHelper.startLogCapture();
    return getConfig()
    .then((config) => {
      const captured = cliHelper.endLogCapture();
      captured.consoleLogs.length.should.equal(0);
      captured.consoleWarns.length.should.equal(0);
      captured.consoleErrors.length.should.equal(0);

      config.should.deep.equal(data);
    });
  });
});
