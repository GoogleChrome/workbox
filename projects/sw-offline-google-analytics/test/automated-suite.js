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

const browserifyTests = require('../../../lib/browserify-tests.js');
const path = require('path');
const seleniumAssistant = require('selenium-assistant');
const swTestingHelpers = require('sw-testing-helpers');
const testServer = new swTestingHelpers.TestServer();

const TIMEOUT = 10 * 1000;

describe('sw-offline-google-analytics Test Suite', function() {
  this.timeout(TIMEOUT);
  let baseTestUrl;

  // Set up the web server before running any tests in this suite.
  before(function() {
    const baseDirectory = __dirname.replace(path.sep, '/');
    return browserifyTests(`${baseDirectory}/unit/`).then(() => {
      return testServer.startServer('.').then(portNumber => {
        baseTestUrl = `http://localhost:${portNumber}/projects/sw-offline-google-analytics/test/`;
      });
    });
  });

  // Kill the web server once all tests are complete.
  after(function() {
    return testServer.killServer();
  });

  seleniumAssistant.getAvailableBrowsers().forEach(function(browser) {
    let globalDriverReference = null;

    // Tear down the driver at the end of each sub-suite.
    after(function() {
      return seleniumAssistant.killWebDriver(globalDriverReference);
    });

    describe(`Unit Tests (${browser.getPrettyName()})`, function() {
      it('should pass all tests', function() {
        return browser.getSeleniumDriver().then(function(driver) {
          globalDriverReference = driver;
          globalDriverReference.manage().timeouts().setScriptTimeout(TIMEOUT);
          return swTestingHelpers.mochaUtils.startWebDriverMochaTests(
            browser.getPrettyName(),
            globalDriverReference,
            `${baseTestUrl}unit/`
          ).then(function(testResults) {
            if (testResults.failed.length > 0) {
              const errorMessage = swTestingHelpers.mochaUtils.prettyPrintErrors(
                browser.prettyName,
                testResults
              );

              throw new Error(errorMessage);
            }
          });
        });
      });
    });
  });
});
