/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

const seleniumAssistant = require('selenium-assistant');
const swTestingHelpers = require('sw-testing-helpers');
const testServer = new swTestingHelpers.TestServer();

require('chromedriver');
require('operadriver');
require('geckodriver');

const RETRIES = 4;
const TIMEOUT = 10 * 1000;

const setupTestSuite = (assistantDriver) => {
  describe(`sw-lib Tests in ${assistantDriver.getPrettyName()}`, function() {
    this.retries(RETRIES);
    this.timeout(TIMEOUT);

    let globalDriverBrowser;
    let baseTestUrl;

    // Set up the web server before running any tests in this suite.
    before(function() {
      return testServer.startServer('.').then((portNumber) => {
        baseTestUrl = `http://localhost:${portNumber}/packages/sw-lib`;
      });
    });

    // Kill the web server once all tests are complete.
    after(function() {
      return testServer.killServer();
    });

    afterEach(function() {
      return seleniumAssistant.killWebDriver(globalDriverBrowser)
      .then(() => {
        globalDriverBrowser = null;
      });
    });

    it('should pass all browser based unit tests', function() {
      return assistantDriver.getSeleniumDriver()
      .then((driver) => {
        globalDriverBrowser = driver;
      })
      .then(() => {
        return swTestingHelpers.mochaUtils.startWebDriverMochaTests(
          assistantDriver.getPrettyName(),
          globalDriverBrowser,
          `${baseTestUrl}/test/browser-unit/`
        );
      })
      .then((testResults) => {
        if (testResults.failed.length > 0) {
          const errorMessage = swTestingHelpers.mochaUtils.prettyPrintErrors(
            assistantDriver.getPrettyName(),
            testResults
          );

          throw new Error(errorMessage);
        }
      });
    });
  });
};

const availableBrowsers = seleniumAssistant.getAvailableBrowsers();
availableBrowsers.forEach((browser) => {
  switch(browser.getSeleniumBrowserId()) {
    case 'chrome':
    case 'firefox':
    case 'opera':
      if (browser.getSeleniumBrowserId() === 'opera' &&
        browser.getVersionNumber() <= 43) {
        console.log(`Skipping Opera <= 43 due to driver issues.`);
        return;
      }
      setupTestSuite(browser);
      break;
    default:
      console.log(`Skipping tests for ${browser.getSeleniumBrowserId()}`);
      break;
  }
});
