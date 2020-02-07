/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const clearRequire = require('clear-require');
const glob = require('glob');
const gulp = require('gulp');
const oneLine = require('common-tags').oneLine;
const path = require('path');
const seleniumAssistant = require('selenium-assistant');

const constants = require('./utils/constants');
const getNpmCmd = require('./utils/get-npm-cmd');
const logHelper = require('../infra/utils/log-helper');
const server = require('../infra/testing/server/index');
const spawn = require('./utils/spawn-promise-wrapper');

const runFiles = (filePaths) => {
  // Mocha can't be run multiple times, which we need for NODE_ENV.
  // More info: https://github.com/mochajs/mocha/issues/995
  clearRequire.all();
  const Mocha = require('mocha');

  return new Promise((resolve, reject) => {
    const mocha = new Mocha({
      retries: process.env.TRAVIS ? 4 : 1,
      timeout: 3 * 60 * 1000,
    });

    for (const filePath of filePaths) {
      mocha.addFile(filePath);
    }

    // Run the tests.
    mocha.run(function(failureCount) {
      if (failureCount > 0) {
        return reject(new Error(`${failureCount} tests failed.`));
      }
      resolve();
    });
  });
};

const runIntegrationTestSuite = async (testPath, nodeEnv, seleniumBrowser,
  webdriver) => {
  logHelper.log(oneLine`
    Running Integration test on ${logHelper.highlight(testPath)}
    with NODE_ENV '${nodeEnv}'
    and browser '${logHelper.highlight(seleniumBrowser.getPrettyName())}'
  `);

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
        path.posix.join(__dirname, '..', testPath, 'test-*.js'));

    await runFiles(testFiles);
  } catch (err) {
    // Log the error, so it's easier to debug failures.
    console.error(err); // eslint-disable-line no-console
    throw new Error(`'gulp test-integration' discovered errors.`);
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
  }
};

const runIntegrationForBrowser = async (browser) => {
  const packagesToTest = glob.sync(`test/${global.packageOrStar}/integration`);

  for (const buildKey of Object.keys(constants.BUILD_TYPES)) {
    const webdriver = await browser.getSeleniumDriver();
    // Safari Tech Preview can take a long time when working with SW APIs
    const timeout = 2 * 60 * 1000;
    webdriver.manage().setTimeouts({
      implicit: timeout,
      pageLoad: timeout,
      script: timeout,
    });

    for (const packageToTest of packagesToTest) {
      const nodeEnv = constants.BUILD_TYPES[buildKey];
      try {
        await runIntegrationTestSuite(packageToTest, nodeEnv, browser,
            webdriver);
      } catch (error) {
        await seleniumAssistant.killWebDriver(webdriver);
        throw error;
      }
    }

    await seleniumAssistant.killWebDriver(webdriver);
  }
};

gulp.task('test-integration', async () => {
  if (process.platform === 'win32') {
    logHelper.warn(`Skipping integration tests on Windows.`);
    return;
  }

  // Install the latest Chrome and Firefox webdrivers without referencing
  // package-lock.json, to ensure that they're up to date.
  await spawn(getNpmCmd(),
      `install --no-save chromedriver geckodriver`.split(' '));

  logHelper.log(`Downloading browsers......`);
  const expiration = 24;
  await seleniumAssistant.downloadLocalBrowser('chrome', 'stable', expiration);
  await seleniumAssistant.downloadLocalBrowser('chrome', 'beta', expiration);
  await seleniumAssistant.downloadLocalBrowser('firefox', 'stable', expiration);
  await seleniumAssistant.downloadLocalBrowser('firefox', 'beta', expiration);

  const packagesToTest = glob.sync(`test/${global.packageOrStar}/integration`);
  if (packagesToTest.length === 0) {
    return;
  }

  await server.start();

  try {
    const localBrowsers = seleniumAssistant.getLocalBrowsers();
    for (const localBrowser of localBrowsers) {
      switch (localBrowser.getId()) {
        case 'chrome':
        case 'firefox':
          if (localBrowser.getReleaseName() !== 'unstable') {
            await runIntegrationForBrowser(localBrowser);
          }
          break;
        case 'safari':
          if (localBrowser.getReleaseName() === 'stable') {
            await runIntegrationForBrowser(localBrowser);
          }
          break;
        default:
          logHelper.warn(oneLine`
            Skipping integration tests for ${localBrowser.getPrettyName()}.
          `);
      }
    }
    await server.stop();
  } catch (err) {
    await server.stop();
    throw err;
  }
});
