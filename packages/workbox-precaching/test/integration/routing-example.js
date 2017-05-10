const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra');

const testServerGen = require('../../../../utils/test-server-generator.js');

/**
 * This test is largely a smoke test to ensure the routes from PrecacheManager
 * is possible.
 */
module.exports = (webdriverCb) => {
  describe('Routing Example', function() {
    let tmpDirectory;
    let testServer;
    let baseTestUrl;
    let webdriverInstance;

    before(function() {
      tmpDirectory = fs.mkdtempSync(
        path.join(__dirname, 'tmp-')
      );

      fsExtra.copySync(
        path.join(__dirname, '..', 'static', 'routing-demo'),
        tmpDirectory);

      webdriverInstance = webdriverCb();
      if (!webdriverInstance) {
        throw new Error('Skipping selenium test due to no webdriver.');
      }

      testServer = testServerGen();
      return testServer.start('.', 5050)
      .then((portNumber) => {
        baseTestUrl = `http://localhost:${portNumber}`;
      });
    });

    after(function() {
      this.timeout(4 * 1000);

      fsExtra.removeSync(tmpDirectory);

      return testServer.stop();
    });

    it('should be able to install a service worker and serve page offline', function() {
      this.timeout(14 * 1000);

      const relativePath = path.relative('.', tmpDirectory);

      return webdriverInstance.get(baseTestUrl + `/${relativePath}/`)
      .then(() => {
        return webdriverInstance.wait(() => {
          return webdriverInstance.executeScript(() => {
            return typeof window.__testResult !== 'undefined';
          });
        });
      })
      .then(() => {
        return webdriverInstance.executeScript(() => {
          return window.__testResult;
        });
      })
      .then((testResult) => {
        if (testResult.error) {
          throw new Error('Unable to load page: ' + testResult.error);
        }

        fsExtra.removeSync(path.join(tmpDirectory, 'example.html'));
      })
      .then(() => {
        return webdriverInstance.get(baseTestUrl + `/${relativePath}/example.html`);
      })
      .then(() => {
        return webdriverInstance.wait(() => {
          return webdriverInstance.executeScript(() => {
            return typeof window.__testResult !== 'undefined';
          });
        });
      });
    });
  });
};
