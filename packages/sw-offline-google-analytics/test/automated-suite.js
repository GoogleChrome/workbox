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

'use strict';

/* eslint-env node, mocha, browser, serviceworker */
/* eslint-disable max-len, no-unused-expressions */

// These tests make use of selenium-webdriver. You can find the relevant
// documentation here: http://selenium.googlecode.com/git/docs/api/javascript/index.html

const seleniumAssistant = require('selenium-assistant');
const swTestingHelpers = require('sw-testing-helpers');
const testServer = require('../../../utils/test-server');

// Ensure the selenium drivers are added Node scripts path.
require('geckodriver');
require('chromedriver');
require('operadriver');

const TIMEOUT = 10 * 1000;
const RETRIES = 3;

describe(`sw-offline-google-analytics Test Suite`, function() {
  this.retries(RETRIES);
  this.timeout(TIMEOUT);

  let globalDriverReference = null;
  let baseTestUrl;

  // Set up the web server before running any tests in this suite.
  before(function() {
    return testServer.start('.').then((portNumber) => {
      baseTestUrl = `http://localhost:${portNumber}/packages/sw-offline-google-analytics/test/`;
    });
  });

  // Kill the web server once all tests are complete.
  after(function() {
    return testServer.stop();
  });

  afterEach(function() {
    this.timeout(6000);

    return seleniumAssistant.killWebDriver(globalDriverReference)
    .then(() => {
      globalDriverReference = null;
    });
  });

  const configureTestSuite = function(browser) {
    it(`should pass all tests in (${browser.getPrettyName()} - ${browser.getVersionNumber()})`, function() {
      return browser.getSeleniumDriver()
      .then((driver) => {
        globalDriverReference = driver;
        globalDriverReference.manage().timeouts().setScriptTimeout(TIMEOUT);
      })
      .then(() => {
        return swTestingHelpers.mochaUtils.startWebDriverMochaTests(
          browser.getPrettyName(),
          globalDriverReference,
          `${baseTestUrl}unit/`
        );
      })
      .then((testResults) => {
        console.log(
          swTestingHelpers.mochaUtils.prettyPrintResults(testResults)
        );

        if (testResults.failed.length > 0) {
          throw new Error('Some of the browser tests failed.');
        }
      });
    });
  };

  seleniumAssistant.getLocalBrowsers().forEach(function(browser) {
    // Blackliist browsers here if needed.
    if (browser.getId() === 'opera' && browser.getVersionNumber() === 41) {
      console.warn('Skipping Opera version 41 due to operadriver error.');
      return;
    }

    switch (browser.getId()) {
      case 'chrome':
      case 'firefox':
      case 'opera':
        if (browser.getId() === 'opera' &&
          browser.getVersionNumber() <= 43) {
          console.log(`Skipping Opera <= 43 due to driver issues.`);
          return;
        }
        configureTestSuite(browser);
        break;
      default:
        console.warn(`Skipping ${browser.getPrettyName()}.`);
        break;
    }
  });
});
