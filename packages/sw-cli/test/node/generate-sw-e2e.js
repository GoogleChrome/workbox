const proxyquire = require('proxyquire');
const path = require('path');
const fs = require('fs');

const fsExtra = require('fs-extra');

const testServerGen = require('../../../../utils/test-server-generator.js');
const validator = require('../utils/e2e-sw-validator.js');

require('chai').should();

describe('Generate SW End-to-End Tests', function() {
  let tmpDirectory;
  let testServer;
  let baseTestUrl;

  // NOTE: No jpg
  const FILE_EXTENSIONS = ['html', 'css', 'js', 'png'];

  before(function() {
    tmpDirectory = fs.mkdtempSync(
      path.join(__dirname, 'tmp-')
    );

    testServer = testServerGen();
    return testServer.start(tmpDirectory, 5050)
    .then((portNumber) => {
      baseTestUrl = `http://localhost:${portNumber}`;
    });
  });

  // Kill the web server once all tests are complete.
  after(function() {
    this.timeout(10 * 1000);

    fsExtra.removeSync(tmpDirectory);

    return testServer.stop();
  });

  it('should be able to generate a service for example-1 with CLI', function() {
    this.timeout(120 * 1000);
    this.retries(3);

    process.chdir(tmpDirectory);

    fsExtra.copySync(
      path.join(__dirname, '..', 'static', 'example-project-1'),
      tmpDirectory);

    const dest = `build/${Date.now()}-sw.js`;

    let enforceNoQuestions = false;
    const SWCli = proxyquire('../../build/index', {
      './lib/questions/ask-root-of-web-app': () => {
        if (enforceNoQuestions) {
          return Promise.reject('Injected Error - No Questions Expected');
        }
        return Promise.resolve(tmpDirectory);
      },
      './lib/questions/ask-sw-name': () => {
        if (enforceNoQuestions) {
          return Promise.reject('Injected Error - No Questions Expected');
        }
        return Promise.resolve(dest);
      },
      './lib/questions/ask-save-config': () => {
        if (enforceNoQuestions) {
          return Promise.reject('Injected Error - No Questions Expected');
        }
        return Promise.resolve(true);
      },
      './lib/questions/ask-extensions-to-cache': () => {
        if (enforceNoQuestions) {
          return Promise.reject('Injected Error - No Questions Expected');
        }
        return Promise.resolve(FILE_EXTENSIONS);
      },
    });

    const cli = new SWCli();
    return validator.performTest(() => {
      return cli.handleCommand('generate:sw');
    }, {
      exampleProject: tmpDirectory,
      dest,
      fileExtensions: FILE_EXTENSIONS,
      baseTestUrl,
    })
    .then(() => {
      // Should be able to handle command with no questions
      enforceNoQuestions = true;
      return validator.performTest(() => {
        return cli.handleCommand('generate:sw');
      }, {
        exampleProject: tmpDirectory,
        dest,
        fileExtensions: FILE_EXTENSIONS,
        baseTestUrl,
      });
    });
  });
});
