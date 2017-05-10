const proxyquire = require('proxyquire');
const sinon = require('sinon');
const cliHelper = require('../utils/cli-test-helper.js');
const errors = require('../../src/lib/errors.js');

require('chai').should();


describe('Ask for File Manifest Name', function() {
  const globalStubs = [];
  const Q_PATH = '../../src/lib/questions/ask-manifest-name.js';

  afterEach(function() {
    cliHelper.endLogCapture();
    globalStubs.forEach((stub) => {
      stub.restore();
    });
  });

  const INJECTED_ERROR = new Error('Injected Error');

  const checkError = (askManifestFileName, expectedErrorCode, checkInjectedError) => {
    return askManifestFileName()
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

    const askManifestFileName = proxyquire(Q_PATH, {
      'inquirer': inquirer,
    });

    cliHelper.startLogCapture();
    return checkError(askManifestFileName, 'unable-to-get-file-manifest-name');
  });

  it('should handle empty filename', function() {
    const inquirer = require('inquirer');
    const stub = sinon.stub(inquirer, 'prompt', () => {
      return Promise.resolve({
        fileManifestName: '    ',
      });
    });

    globalStubs.push(stub);

    const askManifestFileName = proxyquire(Q_PATH, {
      'inquirer': inquirer,
    });

    cliHelper.startLogCapture();
    return checkError(askManifestFileName, 'invalid-file-manifest-name', false);
  });

  it('should trim filename', function() {
    const EXAMPLE_FILENAME = 'example.json';
    const inquirer = require('inquirer');
    const stub = sinon.stub(inquirer, 'prompt', () => {
      return Promise.resolve({
        fileManifestName: `    ${EXAMPLE_FILENAME}    `,
      });
    });

    globalStubs.push(stub);

    const askManifestFileName = proxyquire(Q_PATH, {
      'inquirer': inquirer,
    });

    return askManifestFileName()
    .then((filename) => {
      filename.should.equal(EXAMPLE_FILENAME);
    });
  });

  it('should return filename', function() {
    const EXAMPLE_FILENAME = 'example.json';
    const inquirer = require('inquirer');
    const stub = sinon.stub(inquirer, 'prompt', () => {
      return Promise.resolve({
        fileManifestName: EXAMPLE_FILENAME,
      });
    });

    globalStubs.push(stub);

    const askManifestFileName = proxyquire(Q_PATH, {
      'inquirer': inquirer,
    });

    return askManifestFileName()
    .then((filename) => {
      filename.should.equal(EXAMPLE_FILENAME);
    });
  });
});
