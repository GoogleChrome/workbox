const expect = require('chai').expect;
const seleniumAssistant = require('selenium-assistant');

describe(`[workbox-strategies] CacheOnly Requests`, function() {
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

  it(`should respond with cached and non-cached entry`, async function() {
    const testingURl = `${testServerAddress}/test/workbox-strategies/static/cache-only/`;
    const SW_URL = `${testingURl}sw.js`;

    // Load the page and wait for the first service worker to register and activate.
    await webdriver.get(testingURl);

    // Register the first service worker.
    await activateSW(SW_URL);

    let response = await webdriver.executeAsyncScript((cb) => {
      fetch(new URL(`/CacheOnly/InCache/`, location).href)
      .then((response) => response.text())
      .then((responseBody) => cb(responseBody))
      .catch((err) => cb(err.message));
    });
    expect(response).to.equal('Cached');

    // For a non-cached entry, the fetch should throw an error with
    // a message defined by the browser.
    response = await webdriver.executeAsyncScript((cb) => {
      fetch(new URL(`/CacheOnly/NotInCache/`, location).href)
      .then(() => cb(null))
      .catch((err) => cb(err.message));
    });
    expect(response).to.exist;
  });
});
