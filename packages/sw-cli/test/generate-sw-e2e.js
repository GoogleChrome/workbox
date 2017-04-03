const proxyquire = require('proxyquire');
const path = require('path');
const fs = require('fs');

const fsExtra = require('fs-extra');

const testServer = require('../../../utils/test-server.js');
const validator = require('./utils/e2e-sw-validator.js');

require('chai').should();

describe('Generate SW End-to-End Tests', function() {
  let tmpDirectory;
  let baseTestUrl;

  // NOTE: No jpg
  const FILE_EXTENSIONS = ['html', 'css', 'js', 'png'];

  // Kill the web server once all tests are complete.
  after(function() {
    return testServer.stop();
  });

  beforeEach(() => {
    tmpDirectory = fs.mkdtempSync(
      path.join(__dirname, 'tmp-')
    );

    return testServer.start(tmpDirectory)
    .then((portNumber) => {
      baseTestUrl = `http://localhost:${portNumber}`;
    });
  });

  afterEach(function() {
    this.timeout(10 * 1000);

    fsExtra.removeSync(tmpDirectory);
  });

  it('should be able to generate a service for example-1 with CLI', function() {
    this.timeout(120 * 1000);
    this.retries(3);

    process.chdir(tmpDirectory);

    fsExtra.copySync(
      path.join(__dirname, 'static', 'example-project-1'),
      tmpDirectory);

    const swName = `${Date.now()}-sw.js`;

    let enforceNoQuestions = false;
    const SWCli = proxyquire('../build/index', {
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
        return Promise.resolve(swName);
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
      swName,
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
        swName,
        fileExtensions: FILE_EXTENSIONS,
        baseTestUrl,
      });
    });
  });
});
