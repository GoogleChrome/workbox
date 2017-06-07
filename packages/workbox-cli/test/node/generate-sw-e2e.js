const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const sinon = require('sinon');

const SWCli = require('../../build/index');
const testServerGen = require('../../../../utils/test-server-generator.js');
const validator = require('../utils/e2e-sw-validator.js');

require('chai').should();

describe('Generate SW End-to-End Tests', function() {
  let tmpDirectory;
  let testServer;
  let baseTestUrl;
  let stubs = [];

  // NOTE: No jpg
  const FILE_EXTENSIONS = ['html', 'css', 'js', 'png'];

  before(function() {
    tmpDirectory = fs.mkdtempSync(path.join(__dirname, 'tmp-'));

    testServer = testServerGen();
    return testServer.start(tmpDirectory, 5050)
    .then((portNumber) => {
      baseTestUrl = `http://localhost:${portNumber}`;
    });
  });

  // Kill the web server once all tests are complete.
  after(function() {
    this.timeout(10 * 1000);

    return testServer.stop()
      .then(() => fsExtra.remove(tmpDirectory))
      .catch((err) => {
        // This is an issue on Windows where the file system is locked
        // but there doesn't seem to be a fixed based on a number of
        // issues raised on the same subject on Github.
        console.error(err);
      });
  });

  afterEach(function() {
    stubs.forEach((stub) => {
      stub.restore();
    });
    stubs = [];
  });

  it('should be able to generate a service for example-1 with CLI', function() {
    this.timeout(120 * 1000);

    process.chdir(tmpDirectory);

    fsExtra.copySync(
      path.join(__dirname, '..', 'static', 'example-project-1'),
      tmpDirectory);

    const swDest = `${Date.now()}-sw.js`;

    const qStub = sinon.stub(SWCli.prototype, '_askGenerateQuestions')
      .callsFake(() => {
        return Promise.resolve({
          // ./lib/questions/ask-root-of-web-app
          globDirectory: tmpDirectory,
          // ./lib/questions/ask-sw-dest
          swDest: swDest,
          // ./lib/questions/ask-extensions-to-cache
          globPatterns: [`**/*.{${FILE_EXTENSIONS.join(',')}}`],
        });
      });
    stubs.push(qStub);

    const cli = new SWCli();
    return validator.performTest(() => {
      return cli.handleCommand('generate:sw');
    }, {
      exampleProject: tmpDirectory,
      swDest,
      fileExtensions: FILE_EXTENSIONS,
      baseTestUrl,
    });
  });
});
