const gulp = require('gulp');
const oneLine = require('common-tags').oneLine;
const glob = require('glob');
const seleniumAssistant = require('selenium-assistant');
const path = require('path');
const clearRequire = require('clear-require');

// const spawn = require('./utils/spawn-promise-wrapper');
// const getNpmCmd = require('./utils/get-npm-cmd');
const logHelper = require('../infra/utils/log-helper');
const testServer = require('../infra/testing/test-server');

// await spawn(getNpmCmd(), ['run', 'test', '--',
// `${testPath}/**/*.{js,mjs}`,
// '--retries', 3,
// '--timeout', 3*60*1000,
// ...options,
// ]);

const runFile = (filePath) => {
  // https://github.com/mochajs/mocha/issues/995
  clearRequire.all();
  const Mocha = require('mocha');

  return new Promise((resolve, reject) => {
    // Instantiate a Mocha instance.
    const mocha = new Mocha({
      retries: 2,
      timeout: 3 * 60 * 1000,
    });

    mocha.addFile(filePath);

    // Run the tests.
    mocha.run(function(failures) {
      logHelper.log(failures);
      resolve();
    });
  });
};

const runIntegrationTestSuite =
async (testPath, nodeEnv, browserName, webdriver) => {
  logHelper.log(oneLine`
    Running Integration test on ${logHelper.highlight(testPath)}
    with NODE_ENV '${nodeEnv}'
    and browser '${logHelper.highlight(browserName)}'
  `);

  const options = [];
  if (global.cliOptions.grep) {
    options.push('--grep', global.cliOptions.grep);
  }
  const originalNodeEnv = process.env.NODE_ENV;

  process.env.NODE_ENV = nodeEnv;

  global.__workbox = {
    webdriver,
    serverAddr: testServer.getAddress(),
  };

  try {
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
  const webdriver = await browser.getSeleniumDriver();

  try {
    const packagesToTest =
      glob.sync(`test/${global.packageOrStar}/integration`);

    for (const packageToTest of packagesToTest) {
      for (const nodeEnv of ['dev', 'production']) {
        await runIntegrationTestSuite(
          packageToTest, nodeEnv, browser.getPrettyName(), webdriver);
      }
    }

    await seleniumAssistant.killWebDriver(webdriver);
  } catch (err) {
    await seleniumAssistant.killWebDriver(webdriver);
    throw err;
  }
};

gulp.task('test-integration', async () => {
  await testServer.start();

  try {
    const localBrowsers = seleniumAssistant.getLocalBrowsers();
    for (let localBrowser of localBrowsers) {
      await runIntegrationForBrowser(localBrowser);
    }
    await testServer.stop();
  } catch (err) {
    await testServer.stop();
    throw err;
  }

  // TODO Saucelabs browsers for - 1 browser
  // TODO Saucelabs browsers for - 2 browser
});
