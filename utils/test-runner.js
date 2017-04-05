const path = require('path');
const chalk = require('chalk');
const seleniumAssistant = require('selenium-assistant');
const swTestingHelpers = require('sw-testing-helpers');

const testServer = require('./test-server.js');

/* eslint-disable no-console, require-jsdoc, no-invalid-this, max-len */
/* eslint-env mocha */

class TestRunner {
  constructor() {
    this._packagePathsToTest = [];
  }

  addPackage(packageName) {
    this._packagePathsToTest.push(
      path.join(__dirname, '..', 'packages', packageName)
    );
  }

  printHeading(heading) {
    console.log(chalk.inverse(`\n  ☢️  ${heading}  \n`));
  }

  start() {
    const that = this;

    describe('Test Runner Environment', function() {
      before(function() {
        that.printHeading(`Starting test server`);

        return testServer.start('.')
        .then((portNumber) => {
          that._baseTestUrl = `http://localhost:${portNumber}`;
        });
      });

      // Kill the web server once all tests are complete.
      after(function() {
        that.printHeading(`Killing test server`);
        return testServer.stop();
      });

      that._configureBrowserTests();
    });
  }

  _configureBrowserTests() {
    const availableBrowsers = seleniumAssistant.getLocalBrowsers();
    availableBrowsers.forEach((browser) => {
      switch(browser.getId()) {
        case 'chrome':
        case 'firefox':
          if(browser.getReleaseName() !== 'stable') {
            return;
          }

          this._startBrowserTests(browser);
          break;
      }
    });
  }

  _startBrowserTests(browser) {
    const that = this;
    describe(`Test Runner Browser Tests - ${browser.getPrettyName()}`, function() {
      let webdriverInstance;

      before(function() {
        // Starting a web driver can be slow...
        this.timeout(10 * 1000);

        that.printHeading(`Start tests in ` + browser.getPrettyName());

        return browser.getSeleniumDriver()
        .then((driver) => {
          webdriverInstance = driver;
        });
      });

      after(function() {
        // Killing a web driver can be slow...
        this.timeout(10 * 1000);

        return seleniumAssistant.killWebDriver(webdriverInstance);
      });

      // NOTE: `packagePath` is the absolute path /<path>/packages/<pkg name>
      that._packagePathsToTest.forEach((packagePath) => {
        const pkgName = path.basename(packagePath);
        it(`should pass '${pkgName}' browser tests`, function() {
          this.timeout(10 * 1000);
          this.retries(2);

          return that._runBrowserTests(webdriverInstance, packagePath);
        });

        it(`should pass '${pkgName}' sw tests`, function() {
          this.timeout(10 * 1000);
          this.retries(2);

          return that._runServiceWorkerTests(webdriverInstance, packagePath);
        });
      });
    });
  }

  _handleMochaResults(testResults) {
    if (process.env.TRAVIS || testResults.failed.length > 0) {
      console.log(
        swTestingHelpers.mochaUtils.prettyPrintResults(testResults)
      );
    }

    if (testResults.failed.length > 0) {
      throw new Error(`${testResults.failed.length} test${testResults.failed.length > 1 ? 's' : ''} failed.`);
    }
  }

  _runServiceWorkerTests(webdriver, packagePath) {
    return swTestingHelpers.mochaUtils.startWebDriverMochaTests(
      path.basename(packagePath),
      webdriver,
      `${this._baseTestUrl}/__test/mocha/sw/${path.basename(packagePath)}`
    )
    .then(this._handleMochaResults);
  }

  _runBrowserTests(webdriver, packagePath) {
    return swTestingHelpers.mochaUtils.startWebDriverMochaTests(
      path.basename(packagePath),
      webdriver,
      `${this._baseTestUrl}/__test/mocha/browser/${path.basename(packagePath)}`
    )
    .then(this._handleMochaResults);
  }
}

module.exports = new TestRunner();
