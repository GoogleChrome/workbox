const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');
const testServerGen = require('../../../infra/utils/test-server-generator.js');
const validator = require('../../../infra/utils/e2e-sw-validator.js');

require('chai').should();

describe(`Generate SW End-to-End Tests`, function() {
  let tmpDirectory;
  let testServer;
  let baseTestUrl;
  // NOTE: No JPG
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

  it(`should be able to generate a service for example-1 with workbox-build`, function() {
    this.timeout(120 * 1000);

    process.chdir(tmpDirectory);

    fsExtra.copySync(
      path.join(__dirname, '..', 'static', 'example-project-1'),
      tmpDirectory);

    const swDest = `build/${Date.now()}-sw.js`;
    const modifyUrlPrefix = {
      '': '../',
    };
    const workboxBuild = require('../../../packages/workbox-build/src/index.js');
    return validator.performTest(() => {
      return workboxBuild.generateSW({
        globDirectory: tmpDirectory,
        swDest,
        globPatterns: [`**/*.{${FILE_EXTENSIONS.join(',')}}`],
        cacheId: 'example-cache-id',
        modifyUrlPrefix,
      });
    }, {
      exampleProject: tmpDirectory,
      swDest,
      fileExtensions: FILE_EXTENSIONS,
      baseTestUrl,
      modifyUrlPrefix,
    });
  });
});
