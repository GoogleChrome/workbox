const proxyquire = require('proxyquire');
const sinon = require('sinon');
const cliHelper = require('./helpers/cli-test-helper.js');
const errors = require('../src/lib/errors.js');

require('chai').should();

describe('Ask for Service Worker Name', function() {
  const globalStubs = [];
  const CLI_PATH = '../build/index.js';

  afterEach(function() {
    cliHelper.endLogCapture();
    globalStubs.forEach((stub) => {
      stub.restore();
    });
  });

  const INJECTED_ERROR = new Error('Injected Error');

  const checkError = (cli, expectedErrorCode, checkInjectedError) => {
    return cli._getServiceWorkerName()
    .then(() => {
      throw new Error('Expected error to be thrown.');
    }, (err) => {
      if (typeof checkInjectedError === 'undefined' ||
        checkInjectedError === true) {
        err.should.equal(INJECTED_ERROR);
      }
    })
    .then(() => {
      const captured = cliHelper.endLogCapture();
      captured.consoleLogs.length.should.equal(0);
      captured.consoleWarns.length.should.equal(0);
      captured.consoleErrors.length.should.not.equal(0);

      let foundErrorMsg = false;
      let foundInjectedErrorMsg = false;
      captured.consoleErrors.forEach((errLog) => {
        if (errLog.indexOf(errors[expectedErrorCode]) !== -1) {
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
    });
  };

  it('should handle failing inquirer', function() {
    const inquirer = require('inquirer');
    const stub = sinon.stub(inquirer, 'prompt', () => {
      return Promise.reject(INJECTED_ERROR);
    });

    globalStubs.push(stub);

    const SWCli = proxyquire(CLI_PATH, {
      'inquirer': inquirer,
    });

    cliHelper.startLogCapture();
    const cli = new SWCli();
    return checkError(cli, 'unable-to-get-sw-name');
  });

  it('should handle empty filename', function() {
    const inquirer = require('inquirer');
    const stub = sinon.stub(inquirer, 'prompt', () => {
      return Promise.resolve({
        serviceWorkerName: '    ',
      });
    });

    globalStubs.push(stub);

    const SWCli = proxyquire(CLI_PATH, {
      'inquirer': inquirer,
    });

    cliHelper.startLogCapture();
    const cli = new SWCli();
    return checkError(cli, 'invalid-sw-name', false);
  });

  it('should trim filename', function() {
    const EXAMPLE_FILENAME = 'example.json';
    const inquirer = require('inquirer');
    const stub = sinon.stub(inquirer, 'prompt', () => {
      return Promise.resolve({
        serviceWorkerName: `    ${EXAMPLE_FILENAME}    `,
      });
    });

    globalStubs.push(stub);

    const SWCli = proxyquire(CLI_PATH, {
      'inquirer': inquirer,
    });

    const cli = new SWCli();
    return cli._getServiceWorkerName()
    .then((filename) => {
      filename.should.equal(EXAMPLE_FILENAME);
    });
  });

  it('should return filename', function() {
    const EXAMPLE_FILENAME = 'example.json';
    const inquirer = require('inquirer');
    const stub = sinon.stub(inquirer, 'prompt', () => {
      return Promise.resolve({
        serviceWorkerName: EXAMPLE_FILENAME,
      });
    });

    globalStubs.push(stub);

    const SWCli = proxyquire(CLI_PATH, {
      'inquirer': inquirer,
    });

    const cli = new SWCli();
    return cli._getServiceWorkerName()
    .then((filename) => {
      filename.should.equal(EXAMPLE_FILENAME);
    });
  });
});
