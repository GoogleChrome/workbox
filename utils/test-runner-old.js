/* eslint-env mocha */
/* eslint-disable no-invalid-this, max-len */

/**
const chalk = require('chalk');
const seleniumAssistant = require('selenium-assistant');
const swTestingHelpers = require('sw-testing-helpers');

const testServer = require('./test-server.js');

const INTEGRATION_RETRIES = 3;
const INTEGRATION_TIMEOUT = 10 * 1000;

let baseTestUrl;
let globalDriverBrowser;

const printHeading = (heading) => {
  console.log('\n' + chalk.inverse(`⚛️  ${heading}  `));
};

const runSWTests = (assistantDriver, packageName, packagePath) => {
  describe(`[${packageName} + ${assistantDriver.getPrettyName()}] Service Worker Tests`, function() {
    this.retries(INTEGRATION_RETRIES);
    this.timeout(INTEGRATION_TIMEOUT);

    it('should pass all browser based unit tests', function() {
      return assistantDriver.getSeleniumDriver()
      .then((driver) => {
        globalDriverBrowser = driver;
      })
      .then(() => {
        return swTestingHelpers.mochaUtils.startWebDriverMochaTests(
          assistantDriver.getPrettyName(),
          globalDriverBrowser,
          `${baseTestUrl}/__test/mocha/sw/${packageName}`
        );
      })
      .then((testResults) => {
        if (process.env.TRAVIS || testResults.failed.length > 0) {
          console.log(
            swTestingHelpers.mochaUtils.prettyPrintResults(testResults)
          );
        }

        if (testResults.failed.length > 0) {
          throw new Error('Failing tests');
        }
      });
    });
  });
};

// This function is given a browser and each set of tests can be
// run through this.
const setupTestSuite = (assistantDriver, packageName, packagePath) => {
  // Run Service Worker Tests
  runSWTests(assistantDriver, packageName, packagePath);
};

module.exports = (packagePath) => {
  if (!path.isAbsolute(packagePath)) {
    throw new Error(`The path for the package MUST BE ABSOLUTE. Was given: ` +
      `${packagePath}`);
  }

  const packageName = path.basename(packagePath);

  printHeading(`Running '${packageName}' Tests`);

  describe(`All Tests for ${packageName}`, function() {
    // Set up the web server before running any tests in this suite.
    before(function() {
      return testServer.start('.')
      .then((portNumber) => {
        baseTestUrl = `http://localhost:${portNumber}`;
      });
    });

    // Kill the web server once all tests are complete.
    after(function() {
      return testServer.stop();
    });

    afterEach(function() {
      // Killing a web driver can be slow...
      this.timeout(10 * 1000);

      if (!globalDriverBrowser) {
        return;
      }

      return seleniumAssistant.killWebDriver(globalDriverBrowser)
      .then(() => {
        globalDriverBrowser = null;
      });
    });


  });
};
**/
