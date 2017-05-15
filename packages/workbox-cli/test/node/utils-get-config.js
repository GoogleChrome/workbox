const proxyquire = require('proxyquire');
const path = require('path');

const cliHelper = require('../utils/cli-test-helper.js');
const errors = require('../../src/lib/errors');
const constants = require('../../src/lib/constants');

describe('Test Get Config', function() {
  before(function() {
    proxyquire.noCallThru();
  });

  after(function() {
    proxyquire.callThru();
  });

  it('should be able to handle readFile error', function() {
    const configPath = path.join(process.cwd(), constants.configName);
    const proxyquireInput = {};
    proxyquireInput[configPath] = null;
    const getConfig = proxyquire('../../src/lib/utils/get-config',
      proxyquireInput);
    return getConfig()
    .then((config) => {
      if (config !== null) {
        throw new Error('Unexpected response from getConfig.');
      }
    });
  });

  it('should handle non-JS Object config file', function() {
    const configPath = path.join(process.cwd(), constants.configName);
    const proxyquireInput = {};
    proxyquireInput[configPath] = [];
    const getConfig = proxyquire('../../src/lib/utils/get-config',
      proxyquireInput);

    cliHelper.startLogCapture();
    return getConfig()
    .then((config) => {
      const captured = cliHelper.endLogCapture();
      if (config !== null) {
        throw new Error('Unexpected response from getConfig.');
      }

      captured.consoleLogs.length.should.equal(0);
      captured.consoleWarns.length.should.equal(1);
      captured.consoleErrors.length.should.equal(0);

      let foundWarningMsg = false;
      captured.consoleWarns.forEach((errLog) => {
        if (errLog.indexOf(errors['config-not-an-object']) !== -1) {
          foundWarningMsg = true;
        }
      });
      if (!foundWarningMsg) {
        console.log('Warnings: ', captured.consoleWarns);
        throw new Error('Unexpected warning message printed');
      }
    });
  });

  it('should handle JS Object config file', function() {
    const data = {
      example: 'Hi.',
    };
    const configPath = path.join(process.cwd(), constants.configName);
    const proxyquireInput = {};
    proxyquireInput[configPath] = data;
    const getConfig = proxyquire('../../src/lib/utils/get-config',
      proxyquireInput);

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
