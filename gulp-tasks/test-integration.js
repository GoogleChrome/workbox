const gulp = require('gulp');
const oneLine = require('common-tags').oneLine;
const glob = require('glob');
const seleniumAssistant = require('selenium-assistant');
const path = require('path');
const clearRequire = require('clear-require');

const constants = require('./utils/constants');
const logHelper = require('../infra/utils/log-helper');
const testServer = require('../infra/testing/test-server');

const runFile = (filePath) => {
  // Mocha can't be run multiple times, which we need for NODE_ENV.
  // More info: https://github.com/mochajs/mocha/issues/995
  clearRequire.all();
  const Mocha = require('mocha');

  return new Promise((resolve, reject) => {
    const mocha = new Mocha({
      retries: 2,
      timeout: 3 * 60 * 1000,
    });

    mocha.addFile(filePath);

    // Run the tests.
    mocha.run(function(failureCount) {
      if (failureCount > 0) {
        return reject(`${failureCount} tests failed.`);
      }
      resolve();
    });
  });
};

const runIntegrationTestSuite =
async (testPath, nodeEnv, seleniumBrowser) => {
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
      serverAddr: testServer.getAddress(),
    };

    await runFile(path.join(
      __dirname, '..', 'test', 'workbox-precaching', 'integration',
      'precache-and-update.js'
    ));

    process.env.NODE_ENV = originalNodeEnv;
  } catch (err) {
    process.env.NODE_ENV = originalNodeEnv;

    logHelper.error(err);
    throw new Error(
      `[Workbox Error Msg] 'gulp test-integration' discovered errors.`);
  }
};

const runIntegrationForBrowser = async (browser) => {
  const packagesToTest =
    glob.sync(`test/${global.packageOrStar}/integration`);

  for (const packageToTest of packagesToTest) {
    for (const buildKey of Object.keys(constants.BUILD_TYPES)) {
      const nodeEnv = constants.BUILD_TYPES[buildKey];
      await runIntegrationTestSuite(
        packageToTest, nodeEnv, browser);
    }
  }
};

gulp.task('test-integration', async () => {
  if (process.platform === 'win32') {
    logHelper.warn(`Skipping integration tests on Windows.`);
    return;
  }

  const packagesToTest =
    glob.sync(`test/${global.packageOrStar}/integration`);
  if (packagesToTest.length === 0) {
    return;
  }

  await testServer.start();

  try {
    const localBrowsers = seleniumAssistant.getLocalBrowsers();
    for (let localBrowser of localBrowsers) {
      switch (localBrowser.getId()) {
        case 'chrome':
        case 'firefox':
          await runIntegrationForBrowser(localBrowser);
          break;
        default:
          logHelper.warn(oneLine`
            Skipping integration tests for ${localBrowser.getPrettyName()}.
          `);
      }
    }
    await testServer.stop();
  } catch (err) {
    await testServer.stop();
    throw err;
  }

  // TODO Saucelabs browsers for latest - 1 browser
  // TODO Saucelabs browsers for latest - 2 browser
});
