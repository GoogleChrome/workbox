const seleniumAssistant = require('selenium-assistant');

describe(`[workbox-core] Load core in the browser`, function() {
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
        cb(err.message);
      });
    }, swFile);
    if (error) {
      throw error;
    }
  };

  it(`should load workbox-core in a service worker.`, async function() {
    const testingURl = `${testServerAddress}/test/workbox-core/static/core-in-browser/`;
    const SW_URL = `${testingURl}sw.js`;

    // Load the page and wait for the first service worker to register and activate.
    await webdriver.get(testingURl);

    // Register the service worker.
    await activateSW(SW_URL);

    // If the service worker activated, it meant the assertions in sw.js were
    // met and workbox-core exposes the expected API and defaults that were
    // expected
  });
});
