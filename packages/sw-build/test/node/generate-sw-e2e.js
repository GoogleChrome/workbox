const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');
const testServerGen = require('../../../../utils/test-server-generator.js');
const validator = require('../../../sw-cli/test/utils/e2e-sw-validator.js');

require('chai').should();

describe('Generate SW End-to-End Tests', function() {
  let tmpDirectory;
  let testServer;
  let baseTestUrl;
  // NOTE: No JPG
  const FILE_EXTENSIONS = ['html', 'css', 'js', 'png'];

  // Kill the web server once all tests are complete.
  after(function() {
    return testServer.stop();
  });

  beforeEach(() => {
    tmpDirectory = fs.mkdtempSync(
      path.join(__dirname, 'tmp-')
    );

    testServer = testServerGen();
    return testServer.start(tmpDirectory, 5050)
    .then((portNumber) => {
      baseTestUrl = `http://localhost:${portNumber}`;
    });
  });

  afterEach(function() {
    this.timeout(10 * 1000);

    fsExtra.removeSync(tmpDirectory);
  });

  it('should be able to generate a service for example-1 with sw-build', function() {
    this.timeout(120 * 1000);
    this.retries(2);

    process.chdir(tmpDirectory);

    fsExtra.copySync(
      path.join(__dirname, '..', '..', '..', 'sw-cli', 'test', 'static', 'example-project-1'),
      tmpDirectory);

    const swName = `${Date.now()}-sw.js`;

    const swBuild = require('../../build/index.js');
    return validator.performTest(() => {
      return swBuild.generateSW({
        rootDirectory: tmpDirectory,
        dest: swName,
        staticFileGlobs: [`**\/*.{${FILE_EXTENSIONS.join(',')}}`],
      });
    }, {
      exampleProject: tmpDirectory,
      swName,
      fileExtensions: FILE_EXTENSIONS,
      baseTestUrl,
    });
  });
});
