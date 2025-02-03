/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const clearModule = require('clear-module');
const execa = require('execa');
const glob = require('glob');
const ol = require('common-tags').oneLine;
const upath = require('upath');
const seleniumAssistant = require('selenium-assistant');

const constants = require('./utils/constants');
const logHelper = require('../infra/utils/log-helper');
const server = require('../infra/testing/server/index');

function runFiles(filePaths) {
  // Mocha can't be run multiple times, which we need for NODE_ENV.
  // More info: https://github.com/mochajs/mocha/issues/995
  clearModule.all();
  const Mocha = require('mocha');

  return new Promise((resolve, reject) => {
    const mocha = new Mocha({
      retries: process.env.TRAVIS || process.env.GITHUB_ACTIONS ? 4 : 1,
      timeout: 3 * 60 * 1000,
    });

    for (const filePath of filePaths) {
      mocha.addFile(filePath);
    }

    // Run the tests.
    mocha.run(function (failureCount) {
      if (failureCount > 0) {
        return reject(new Error(`${failureCount} tests failed.`));
      }
      resolve();
    });
  });
}

async function runTestSuite(testPath, nodeEnv, seleniumBrowser, webdriver) {
  logHelper.log(ol`Running integration test on ${logHelper.highlight(testPath)}
      with NODE_ENV '${nodeEnv}' and browser
      '${logHelper.highlight(seleniumBrowser.getPrettyName())}'`);

  const options = [];
  if (global.cliOptions.grep) {
    options.push('--grep', global.cliOptions.grep);
  }
  const originalNodeEnv = process.env.NODE_ENV;

  process.env.NODE_ENV = nodeEnv;

  try {
    global.__workbox = {
      seleniumBrowser,
      server,
      webdriver,
    };

    const testFiles = glob.sync(
      upath.join(__dirname, '..', testPath, 'test-*.js'),
    );

    await runFiles(testFiles);
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
  }
}

async function runIntegrationForBrowser(browser) {
  const packagesToTest = glob.sync(`test/${global.packageOrStar}/integration`);

  for (const buildKey of Object.keys(constants.BUILD_TYPES)) {
    const webdriver = await browser.getSeleniumDriver();
    const timeout = 2 * 60 * 1000;
    webdriver.manage().setTimeouts({
      implicit: timeout,
      pageLoad: timeout,
      script: timeout,
    });

    for (const packageToTest of packagesToTest) {
      // Since workbox-google-analytics is deprecated, removing the tests from integration tests.
      if (packageToTest.includes('workbox-google-analytics')) {
        continue;
      }
      const nodeEnv = constants.BUILD_TYPES[buildKey];
      try {
        await runTestSuite(packageToTest, nodeEnv, browser, webdriver);
      } catch (error) {
        await seleniumAssistant.killWebDriver(webdriver);
        throw error;
      }
    }

    await seleniumAssistant.killWebDriver(webdriver);
  }
}

async function test_integration() {
  if (process.platform === 'win32') {
    logHelper.warn(`Skipping integration tests on Windows.`);
    return;
  }

  // Install the latest Chrome and Firefox webdrivers without referencing
  // package-lock.json, to ensure that they're up to date.
  await execa('npm', ['install', '--no-save', 'chromedriver', 'geckodriver'], {
    preferLocal: true,
  });

  logHelper.log(`Downloading browsers...`);
  const expiration = 24;
  // We are only running tests in stable, see bellow for reasons.
  await seleniumAssistant.downloadLocalBrowser('chrome', 'stable', expiration);
  await seleniumAssistant.downloadLocalBrowser('firefox', 'stable', expiration);

  const packagesToTest = glob.sync(`test/${global.packageOrStar}/integration`);
  if (packagesToTest.length === 0) {
    return;
  }

  await server.start();

  try {
    const localBrowsers = seleniumAssistant.getLocalBrowsers();
    for (const localBrowser of localBrowsers) {
      switch (localBrowser.getId()) {
        case 'firefox':
          if (localBrowser.getReleaseName() !== 'unstable') {
            await runIntegrationForBrowser(localBrowser);
          }
          break;
        // Temporarily only test the stable release of Chrome, until the next
        // https://www.npmjs.com/package/chromedriver release.
        case 'chrome':
        case 'safari':
          if (localBrowser.getReleaseName() === 'stable') {
            await runIntegrationForBrowser(localBrowser);
          }
          break;
        default:
          logHelper.warn(ol`Skipping integration tests for
              ${localBrowser.getPrettyName()}.`);
      }
    }
  } finally {
    await server.stop();
  }
}

module.exports = {
  test_integration,
};
