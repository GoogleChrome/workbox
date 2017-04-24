const path = require('path');
const chalk = require('chalk');
const glob = require('glob');
const seleniumAssistant = require('selenium-assistant');
const swTestingHelpers = require('sw-testing-helpers');

const testServerGen = require('./test-server-generator.js');

/* eslint-disable no-console, require-jsdoc, no-invalid-this, max-len */
/* eslint-env mocha */

class TestRunner {
  constructor(packageNames) {
    this._packagePathsToTest = packageNames.map((packageName) => {
      return path.join(__dirname, '..', 'packages', packageName);
    });
  }

  printHeading(heading) {
    console.log(chalk.inverse(`\n  ☢️  ${heading}  `));
  }

  start() {
    const that = this;

    describe('Test Runner Environment', function() {
      let testServer;

      before(function() {
        that.printHeading(`Starting test server`);

        testServer = testServerGen();
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

      const getBaseTestUrl = () => {
        return that._baseTestUrl;
      };

      that._configureBrowserTests(getBaseTestUrl);

      that._configureNodeTests(getBaseTestUrl);
    });
  }

  _configureBrowserTests(getBaseTestUrl) {
    if (!this._testsRequireBrowser()) {
      return;
    }

    const availableBrowsers = seleniumAssistant.getLocalBrowsers();
    availableBrowsers.forEach((browser) => {
      switch(browser.getId()) {
        case 'chrome':
        case 'firefox':
          this._addBrowserTests(browser, getBaseTestUrl);
          break;
      }
    });
  }

  _addBrowserTests(browser, getBaseTestUrl) {
    const that = this;
    describe(``, function() {
      let webdriverInstance;
      before(function() {
        that.printHeading(`Starting browser tests in ${browser.getPrettyName()} - ${browser.getVersionNumber()}`);
      });

      after(function() {
        // Killing a web driver can be slow...
        this.timeout(10 * 1000);

        return seleniumAssistant.killWebDriver(webdriverInstance);
      });

      it('should be able to get a valid webdriver instance', function() {
        // Starting a web driver can be slow...
        this.timeout(10 * 1000);
        this.retries(2);

        return browser.getSeleniumDriver()
        .then((driver) => {
          webdriverInstance = driver;
        });
      });

      const getWebdriver = () => {
        return webdriverInstance;
      };

      that._packagePathsToTest.forEach((packagePath) => {
        if (that._hasBrowserTests(packagePath)) {
          that._runBrowserTests(getWebdriver, packagePath, getBaseTestUrl, browser.getPrettyName());
        } else if (process.env.TRAVIS) {
          console.log('No browser tests.');
        }

        if (that._hasServiceWorkerTests(packagePath)) {
          that._runServiceWorkerTests(getWebdriver, packagePath, getBaseTestUrl, browser.getPrettyName());
        } else if (process.env.TRAVIS) {
          console.log('No service worker tests.');
        }

        if (that._hasIntegrationTests(packagePath)) {
          that._runIntegrationTests(getWebdriver, packagePath, getBaseTestUrl, browser.getPrettyName());
        } else if (process.env.TRAVIS) {
          console.log('No integration tests.');
        }
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

  _testsRequireBrowser() {
    let hasBrowserTests = false;
    for (let i = 0; i < this._packagePathsToTest.length && !hasBrowserTests; i++) {
      const packagePath = this._packagePathsToTest[i];
      hasBrowserTests = this._hasBrowserTests(packagePath) ||
        this._hasServiceWorkerTests(packagePath) ||
        this._hasIntegrationTests(packagePath);
    }
    return hasBrowserTests;
  }

  _testsRequireNode() {
    let hasNodeTests = false;
    for (let i = 0; i < this._packagePathsToTest.length && !hasNodeTests; i++) {
      const packagePath = this._packagePathsToTest[i];
      hasNodeTests = this._hasNodeTests(packagePath);
    }
    return hasNodeTests;
  }

  _hasServiceWorkerTests(packagePath) {
    return glob.sync(`${packagePath}/test/sw/*.js`).length > 0;
  }

  _hasBrowserTests(packagePath) {
    return glob.sync(`${packagePath}/test/browser/*.js`).length > 0;
  }

  _hasIntegrationTests(packagePath) {
    return glob.sync(`${packagePath}/test/integration/*.js`).length > 0;
  }

  _hasNodeTests(packagePath) {
    return glob.sync(`${packagePath}/test/node/*.js`).length > 0;
  }

  _runBrowserTests(webdriverCb, packagePath, getBaseTestUrl, browserName) {
    const that = this;
    it(`should pass '${path.basename(packagePath)}' browser tests in ${browserName}`, function() {
      this.timeout(10 * 1000);

      const webdriver = webdriverCb();
      if (!webdriver) {
        console.warn('Skipping selenium test due to no webdriver.');
        return;
      }

      return swTestingHelpers.mochaUtils.startWebDriverMochaTests(
        path.basename(packagePath),
        webdriver,
        `${getBaseTestUrl()}/__test/mocha/browser/${path.basename(packagePath)}`
      )
      .then(that._handleMochaResults);
    });
  }

  _runServiceWorkerTests(webdriverCb, packagePath, getBaseTestUrl, browserName) {
    const that = this;
    it(`should pass '${path.basename(packagePath)}' sw tests in ${browserName}`, function() {
      this.timeout(10 * 1000);

      const webdriver = webdriverCb();
      if (!webdriver) {
        console.warn('Skipping selenium test due to no webdriver.');
        return;
      }

      return swTestingHelpers.mochaUtils.startWebDriverMochaTests(
        path.basename(packagePath),
        webdriver,
        `${getBaseTestUrl()}/__test/mocha/sw/${path.basename(packagePath)}`
      )
      .then(that._handleMochaResults);
    });
  }

  _runIntegrationTests(webdriverCb, packagePath, getBaseTestUrl, browserName) {
    const integrationTests = glob.sync(`${packagePath}/test/integration/*.js`);
    global.getBaseTestUrl = getBaseTestUrl;
    integrationTests.forEach((testFile) => {
      const testCb = require(testFile);
      testCb(webdriverCb);
    });
  }

  _configureNodeTests(getBaseTestUrl) {
    if (!this._testsRequireNode()) {
      return;
    }

    const that = this;
    describe(``, function() {
      before(function() {
        that.printHeading(`Starting Node tests`);
      });

      that._packagePathsToTest.forEach((packagePath) => {
        if (that._hasNodeTests(packagePath)) {
          describe(`Node Tests for ${path.basename(packagePath)}`, function() {
            that._runNodeTests(packagePath, getBaseTestUrl);
          });
        } else if (process.env.TRAVIS) {
          console.log('No node tests.');
        }
      });
    });
  }

  _runNodeTests(packagePath, getBaseTestUrl) {
    const nodeTests = glob.sync(`${packagePath}/test/node/*.js`);
    global.getBaseTestUrl = getBaseTestUrl;
    nodeTests.forEach((nodeTextFile) => {
      require(nodeTextFile);
    });
  }
}

module.exports = TestRunner;
