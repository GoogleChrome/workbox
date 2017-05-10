const proxyquire = require('proxyquire');
const sinon = require('sinon');
const path = require('path');
const cliHelper = require('../utils/cli-test-helper.js');
const errors = require('../../src/lib/errors.js');

require('chai').should();

describe('Ask for Root Directory', function() {
  const globalStubs = [];
  const Q_PATH = '../../src/lib/questions/ask-root-of-web-app.js';

  afterEach(function() {
    cliHelper.endLogCapture();
    globalStubs.forEach((stub) => {
      stub.restore();
    });
  });

  const INJECTED_ERROR = new Error('Injected Error');
  const VALID_DIRECTORY_CONTENTS = [
    'injected-file-1',
    'injected-dir-1',
  ];

  const checkError = (askForRootOfWebApp) => {
    return askForRootOfWebApp()
    .then(() => {
      throw new Error('Expected error to be thrown.');
    }, (err) => {
      err.should.equal(INJECTED_ERROR);
    })
    .then(() => {
      const captured = cliHelper.endLogCapture();
      captured.consoleLogs.length.should.equal(0);
      captured.consoleWarns.length.should.equal(0);
      captured.consoleErrors.length.should.not.equal(0);

      let foundErrorMsg = false;
      let foundInjectedErrorMsg = false;
      captured.consoleErrors.forEach((errLog) => {
        if (errLog.indexOf(errors['unable-to-get-rootdir']) !== -1) {
          foundErrorMsg = true;
        }
        if (errLog.indexOf(INJECTED_ERROR.message) !== -1) {
          foundInjectedErrorMsg = true;
        }
      });
      foundErrorMsg.should.equal(true);
      foundInjectedErrorMsg.should.equal(true);
    });
  };

  it('should handle an error from \'fs.readdir()\'', function() {
    const fakeFS = {
      readdir: (directory, cb) => {
        cb(INJECTED_ERROR);
      },
    };

    const askForRootOfWebApp = proxyquire(Q_PATH, {
      fs: fakeFS,
    });

    cliHelper.startLogCapture();
    return checkError(askForRootOfWebApp);
  });

  it('should handle an error from \'fs.statSync()\'', function() {
    const fakeFS = {
      readdir: (directory, cb) => {
        cb(null, VALID_DIRECTORY_CONTENTS);
      },
      statSync: (name) => {
        throw INJECTED_ERROR;
      },
    };

    const askForRootOfWebApp = proxyquire(Q_PATH, {
      fs: fakeFS,
    });

    cliHelper.startLogCapture();
    return checkError(askForRootOfWebApp);
  });

  it('should handle an error from \'inquirer\'', function() {
    const fakeFS = {
      readdir: (directory, cb) => {
        cb(null, VALID_DIRECTORY_CONTENTS);
      },
      statSync: (name) => {
        return {
          isDirectory: () => {
            return true;
          },
        };
      },
    };

    const inquirer = require('inquirer');
    const stub = sinon.stub(inquirer, 'prompt', () => {
      return Promise.reject(INJECTED_ERROR);
    });

    globalStubs.push(stub);

    const askForRootOfWebApp = proxyquire(Q_PATH, {
      'fs': fakeFS,
      'inquirer': inquirer,
    });

    cliHelper.startLogCapture();
    return checkError(askForRootOfWebApp);
  });

  it('should return absolute path from \'inquirer\'', function() {
    // Add node_modules and make sure it's removed via the blacklist
    // .slice() here makes a clone of the array.
    const injectedDirectories = VALID_DIRECTORY_CONTENTS.slice(0);
    injectedDirectories.push('node_modules');

    const fakeFS = {
      readdir: (directory, cb) => {
        cb(null, injectedDirectories);
      },
      statSync: (name) => {
        return {
          isDirectory: () => {
            return true;
          },
        };
      },
    };

    const inquirer = require('inquirer');
    const stub = sinon.stub(inquirer, 'prompt', (questions) => {
      questions.length.should.be.gt(0);
      const choices = questions[0].choices;
      choices.length.should.equal(VALID_DIRECTORY_CONTENTS.length + 2);
      VALID_DIRECTORY_CONTENTS.forEach((dirName, index) => {
        choices[index].should.equal(dirName);
      });

      const results = {};
      results[questions[0].name] = VALID_DIRECTORY_CONTENTS[0];
      return Promise.resolve(results);
    });

    globalStubs.push(stub);

    const askForRootOfWebApp = proxyquire(Q_PATH, {
      'fs': fakeFS,
      'inquirer': inquirer,
    });

    cliHelper.startLogCapture();
    return askForRootOfWebApp()
    .then((rootDir) => {
      const captured = cliHelper.endLogCapture();
      captured.consoleLogs.length.should.equal(0);
      captured.consoleWarns.length.should.equal(0);
      captured.consoleErrors.length.should.equal(0);

      rootDir.should.equal(path.join(process.cwd(), VALID_DIRECTORY_CONTENTS[0]));
    });
  });
});
