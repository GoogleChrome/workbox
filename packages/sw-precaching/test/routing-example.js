const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra');
const seleniumAssistant = require('selenium-assistant');

const testServer = require('../../../utils/test-server.js');

/**
 * This test is largely a smoke test to ensure the routes from PrecacheManager
 * is possible.
 */
describe('Routing Example', function() {
  let tmpDirectory;
  let baseTestUrl;
  let globalDriver;

  afterEach(function() {
    this.timeout(10 * 1000);

    if (globalDriver) {
      return seleniumAssistant.killWebDriver(globalDriver)
      .then(() => {
        globalDriver = null;
      });
    }
  });

  before(function() {
    tmpDirectory = fs.mkdtempSync(
      path.join(__dirname, 'tmp-')
    );

    fsExtra.copySync(
      path.join(__dirname, 'static', 'routing-demo'),
      tmpDirectory);

    return testServer.start('.')
    .then((portNumber) => {
      baseTestUrl = `http://localhost:${portNumber}`;
    });
  });

  after(function() {
    fsExtra.removeSync(tmpDirectory);

    return testServer.stop();
  });

  it('should be able to install a service worker and serve page offline', function() {
    this.timeout(14 * 1000);
    this.retries(3);

    const relativePath = path.relative('.', tmpDirectory);

    const chromeBrowser = seleniumAssistant.getLocalBrowser('chrome', 'stable');
    return chromeBrowser.getSeleniumDriver()
    .then((driver) => {
      globalDriver = driver;
    })
    .then(() => {
      return globalDriver.get(baseTestUrl + `/${relativePath}/`);
    })
    .then(() => {
      return globalDriver.wait(() => {
        return globalDriver.executeScript(() => {
          return typeof window.__testResult !== 'undefined';
        });
      });
    })
    .then(() => {
      return globalDriver.executeScript(() => {
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
      return globalDriver.get(baseTestUrl + `/${relativePath}/example.html`);
    })
    .then(() => {
      return globalDriver.wait(() => {
        return globalDriver.executeScript(() => {
          return typeof window.__testResult !== 'undefined';
        });
      });
    });
  });
});
