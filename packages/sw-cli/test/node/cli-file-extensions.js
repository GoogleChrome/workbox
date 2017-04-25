const proxyquire = require('proxyquire');
const sinon = require('sinon');
const path = require('path');
const cliHelper = require('../utils/cli-test-helper.js');
const errors = require('../../src/lib/errors.js');

require('chai').should();

describe('Ask for File Extensions to Cache', function() {
  const globalStubs = [];
  const Q_PATH = '../../src/lib/questions/ask-extensions-to-cache.js';

  afterEach(function() {
    cliHelper.endLogCapture();
    globalStubs.forEach((stub) => {
      stub.restore();
    });
  });

  const INJECTED_ERROR = new Error('Injected Error');
  const INITIAL_ROOT_DIR = path.sep;
  const VALID_DIRECTORY_CONTENTS = [
    'injected-file-1.txt',
    'injected-dir-1',
  ];

  const checkError = (askForExtensionsToCache, expectedErrorCode, checkInjectedError) => {
    return askForExtensionsToCache(INITIAL_ROOT_DIR)
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

  it('should handle an error from \'fs.readdir()\' on first call', function() {
    const fakeFS = {
      readdir: (directory, cb) => {
        cb(INJECTED_ERROR);
      },
    };

    const askForExtensionsToCache = proxyquire(Q_PATH, {
      fs: fakeFS,
    });

    cliHelper.startLogCapture();
    return checkError(askForExtensionsToCache, 'unable-to-get-file-extensions');
  });

  it('should handle an error from \'fs.readdir()\' during scan', function() {
    const fakeFS = {
      readdir: (directory, cb) => {
        if (directory === INITIAL_ROOT_DIR) {
          cb(null, VALID_DIRECTORY_CONTENTS);
        } else {
          cb(INJECTED_ERROR);
        }
      },
      statSync: (directory) => {
        if (directory === '/injected-file-1.txt') {
          return {
            isDirectory: () => {
              return false;
            },
          };
        } else {
          return {
            isDirectory: () => {
              return true;
            },
          };
        }
      },
    };

    const askForExtensionsToCache = proxyquire(Q_PATH, {
      fs: fakeFS,
    });

    cliHelper.startLogCapture();
    return checkError(askForExtensionsToCache, 'unable-to-get-file-extensions');
  });

  it('should handle an error from \'fs.statSync()\'', function() {
    const fakeFS = {
      readdir: (directory, cb) => {
        if (directory === INITIAL_ROOT_DIR) {
          cb(null, VALID_DIRECTORY_CONTENTS);
        } else {
          cb(null, []);
        }
      },
      statSync: (name) => {
        throw INJECTED_ERROR;
      },
    };

    const askForExtensionsToCache = proxyquire(Q_PATH, {
      fs: fakeFS,
    });

    cliHelper.startLogCapture();
    return checkError(askForExtensionsToCache, 'unable-to-get-file-extensions');
  });

  it('should handle no file extensions being available', function() {
    const fakeFS = {
      readdir: (directory, cb) => {
        if (directory === INITIAL_ROOT_DIR) {
          cb(null, [
            'LICENSE',
            'README',
          ]);
        }
      },
      statSync: (directory) => {
        return {
          isDirectory: () => {
            return false;
          },
        };
      },
    };

    const askForExtensionsToCache = proxyquire(Q_PATH, {
      'fs': fakeFS,
    });

    cliHelper.startLogCapture();
    return checkError(askForExtensionsToCache, 'no-file-extensions-found', false);
  });

  it('should handle an error from \'inquirer\'', function() {
    const fakeFS = {
      readdir: (directory, cb) => {
        if (directory === INITIAL_ROOT_DIR) {
          cb(null, VALID_DIRECTORY_CONTENTS);
        } else {
          cb(null, []);
        }
      },
      statSync: (directory) => {
        if (directory === path.sep + 'injected-file-1.txt') {
          return {
            isDirectory: () => {
              return false;
            },
          };
        } else {
          return {
            isDirectory: () => {
              return true;
            },
          };
        }
      },
    };

    const inquirer = require('inquirer');
    const stub = sinon.stub(inquirer, 'prompt', () => {
      return Promise.reject(INJECTED_ERROR);
    });

    globalStubs.push(stub);

    const askForExtensionsToCache = proxyquire(Q_PATH, {
      'fs': fakeFS,
      'inquirer': inquirer,
    });

    cliHelper.startLogCapture();
    return checkError(askForExtensionsToCache, 'unable-to-get-file-extensions');
  });

  it('should handle no files extensions from \'inquirer\'', function() {
    const FILE_ONLY_INPUT = [
      'hello.txt',
      'hello.md',
      'hello.js',
    ];
    const fakeFS = {
      readdir: (directory, cb) => {
        cb(null, FILE_ONLY_INPUT);
      },
      statSync: (name) => {
        return {
          isDirectory: () => {
            return false;
          },
        };
      },
    };

    const inquirer = require('inquirer');
    const stub = sinon.stub(inquirer, 'prompt', (questions) => {
      const results = {};
      results[questions[0].name] = [];
      return Promise.resolve(results);
    });

    globalStubs.push(stub);

    const askForExtensionsToCache = proxyquire(Q_PATH, {
      'fs': fakeFS,
      'inquirer': inquirer,
    });

    cliHelper.startLogCapture();
    return checkError(askForExtensionsToCache, 'no-file-extensions-selected', false);
  });

  it('should return files extensions from \'inquirer\'', function() {
    const FILE_ONLY_INPUT = [
      'hello.txt',
      'hello.md',
      'hello.js',
    ];
    const fakeFS = {
      readdir: (directory, cb) => {
        cb(null, FILE_ONLY_INPUT);
      },
      statSync: (name) => {
        return {
          isDirectory: () => {
            return false;
          },
        };
      },
    };

    const inquirer = require('inquirer');
    const stub = sinon.stub(inquirer, 'prompt', (questions) => {
      questions.length.should.be.gt(0);
      const choices = questions[0].choices;
      choices.length.should.equal(FILE_ONLY_INPUT.length);
      FILE_ONLY_INPUT.forEach((fileName, index) => {
        choices[index].should.equal(path.extname(fileName).substring(1));
      });

      const results = {};
      results[questions[0].name] = [path.extname(FILE_ONLY_INPUT[0])];
      return Promise.resolve(results);
    });

    globalStubs.push(stub);

    const askForExtensionsToCache = proxyquire(Q_PATH, {
      'fs': fakeFS,
      'inquirer': inquirer,
    });

    cliHelper.startLogCapture();
    return askForExtensionsToCache(INITIAL_ROOT_DIR)
    .then((fileExtensions) => {
      const captured = cliHelper.endLogCapture();
      captured.consoleLogs.length.should.equal(0);
      captured.consoleWarns.length.should.equal(0);
      captured.consoleErrors.length.should.equal(0);

      fileExtensions.length.should.equal(1);
      fileExtensions[0].should.equal(path.extname(FILE_ONLY_INPUT[0]));
    });
  });
});
