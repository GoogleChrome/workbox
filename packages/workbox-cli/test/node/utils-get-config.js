const proxyquire = require('proxyquire');
const path = require('path');

const cliHelper = require('../utils/cli-test-helper.js');
const errors = require('../../src/lib/errors');
const constants = require('../../src/lib/constants');

describe(`Test Get Config`, function() {
  before(function() {
    proxyquire.noCallThru();
  });

  after(function() {
    proxyquire.callThru();
  });

  it(`should be able to handle readFile error`, function() {
    const configPath = path.join(process.cwd(), constants.defaultConfigName);
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

  it(`should handle non-JS Object config file`, function() {
    const configPath = path.join(process.cwd(), constants.defaultConfigName);
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

      // There's a 'Using configuration from...' message that's expected.
      captured.consoleLogs.length.should.equal(1);
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

  // process.cwd() needs to be evaluated inside the it() callback, so just
  // define a function that will eventually return the value we want.
  const configFileTestCases = new Map([
    [null, () => path.join(process.cwd(), constants.defaultConfigName)],
    ['relative-path.js', () => path.join(process.cwd(), 'relative-path.js')],
    ['/absolute/path.js', () => '/absolute/path.js'],
  ]);

  for (const [configFile, configPathFunc] of configFileTestCases) {
    it(`should handle reading the JS config when the configFile parameter is ${configFile}`, function() {
      const data = {
        example: 'Hi.',
      };

      const proxyquireInput = {};
      // Generate the config path here, to use the right process.cwd() value.
      const configPath = configPathFunc();
      proxyquireInput[configPath] = data;
      const getConfig = proxyquire('../../src/lib/utils/get-config',
        proxyquireInput);

      cliHelper.startLogCapture();
      return getConfig(configFile)
        .then((config) => {
          const captured = cliHelper.endLogCapture();
          // There's a 'Using configuration from...' message that's expected.
          captured.consoleLogs.length.should.equal(1);
          captured.consoleWarns.length.should.equal(0);
          captured.consoleErrors.length.should.equal(0);

          config.should.deep.equal(data);
        });
    });
  }

  it(`should reject when passed a configFile that doesn't exist`, function() {
    const getConfig = require('../../src/lib/utils/get-config');
    cliHelper.startLogCapture();
    return getConfig('does-not-exist.js')
      .then(() => {
        throw Error('Expected getConfig to reject.');
      })
      .catch((error) => {
        const captured = cliHelper.endLogCapture();
        captured.consoleLogs.length.should.equal(0);
        captured.consoleWarns.length.should.equal(0);
        captured.consoleErrors.length.should.equal(1);

        error.message.should.eql(errors['invalid-config-file-flag']);
      });
  });
});
