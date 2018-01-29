const expect = require('chai').expect;
const seleniumAssistant = require('selenium-assistant');

describe(`[workbox-google-analytics] Load and use Google Analytics`, function() {
  let webdriver;
  let testServerAddress = global.__workbox.server.getAddress();

  beforeEach(async function() {
    if (webdriver) {
      await seleniumAssistant.killWebDriver(webdriver);
      webdriver = null;
    }

    global.__workbox.server.reset();

    // Allow async functions 10s to complete
    webdriver = await global.__workbox.seleniumBrowser.getSeleniumDriver();
    webdriver.manage().timeouts().setScriptTimeout(10 * 1000);
  });

  after(async function() {
    if (webdriver) {
      await seleniumAssistant.killWebDriver(webdriver);
    }
  });

  const activateSW = async (swFile) => {
    const error = await webdriver.executeAsyncScript((swFile, cb) => {
      navigator.serviceWorker.register(swFile)
      .then(() => {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (navigator.serviceWorker.controller.scriptURL.endsWith(swFile)) {
            cb();
          }
        });
      })
      .catch((err) => {
        cb(err);
      });
    }, swFile);
    if (error) {
      throw error;
    }
  };

  it(`should load a page with service worker`, async function() {
    const testingUrl = `${testServerAddress}/test/workbox-google-analytics/static/basic-example/`;
    const SW_URL = `${testingUrl}sw.js`;

    // Load the page and wait for the first service worker to register and activate.
    await webdriver.get(testingUrl);

    // Register the first service worker.
    await activateSW(SW_URL);

    const err = await webdriver.executeAsyncScript((testingUrl, cb) => {
      return fetch('https://www.google-analytics.com/analytics.js', {mode: 'no-cors'})
      .then(() => cb(), (err) => cb(err.message));
    }, testingUrl);

    expect(err).to.not.exist;
  });
});
