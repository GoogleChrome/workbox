/*
 Copyright 2017 Google Inc. All Rights Reserved.
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
const testServer = require('../../../utils/test-server.js');

const RETRIES = 3;
const TIMEOUT = 10 * 1000;
const PACKAGE_NAME = 'sw-cacheable-response';

describe(`${PACKAGE_NAME} Browser Tests`, function() {
  this.retries(RETRIES);
  this.timeout(TIMEOUT);

  let globalDriverBrowser;
  let testHarnessUrl;

  // Set up the web server before running any tests in this suite.
  before(() => testServer.start('.').then((portNumber) => {
    testHarnessUrl = `http://localhost:${portNumber}/__test/mocha/` +
      PACKAGE_NAME;
  }));

  // Kill the web server once all tests are complete.
  after(() => testServer.stop());

  afterEach(() => seleniumAssistant.killWebDriver(globalDriverBrowser)
    .then(() => globalDriverBrowser = null));

  const setupTestSuite = (assistantDriver) => {
    it(`should pass all tests in ${assistantDriver.getPrettyName()}`, () => {
      return assistantDriver.getSeleniumDriver()
        .then((driver) => globalDriverBrowser = driver)
        .then(() => swTestingHelpers.mochaUtils.startWebDriverMochaTests(
          assistantDriver.getPrettyName(),
          globalDriverBrowser,
          testHarnessUrl
        )).then((testResults) => {
          console.log(swTestingHelpers.mochaUtils.prettyPrintResults(testResults));
          if (testResults.failed.length > 0) {
            throw new Error('Some of the browser tests failed.');
          }
        });
    });
  };

  seleniumAssistant.getLocalBrowsers().forEach((browser) => {
    switch(browser.getId()) {
      case 'chrome':
      case 'firefox':
        setupTestSuite(browser);
        break;
      default:
        console.log(`Skipping tests for ${browser.getId()}.`);
    }
  });
});
