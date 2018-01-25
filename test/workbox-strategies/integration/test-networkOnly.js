const expect = require('chai').expect;
const seleniumAssistant = require('selenium-assistant');

describe.only(`[workbox-strategies] NetworkOnly Requests`, function() {
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
    webdriver.manage().timeouts().setScriptTimeout(30 * 1000);
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

  it(`should respond with a non-cached entry`, async function() {
    const testingURl = `${testServerAddress}/test/workbox-strategies/static/network-only/`;
    const SW_URL = `${testingURl}sw.js`;

    // Load the page and wait for the first service worker to register and activate.
    await webdriver.get(testingURl);

    // Register the first service worker.
    await activateSW(SW_URL);

    let response = await webdriver.executeAsyncScript((cb) => {
      fetch(new URL(`/test/uniqueValue`, location).href)
      .then((response) => response.text())
      .then((responseBody) => cb(responseBody))
      .catch((err) => cb(err.message));
    });
    const firstResponse = response.trim();
    expect(firstResponse).to.not.equal('Cached');

    await webdriver.executeAsyncScript((cb) => {
      caches.delete('network-only')
      .then(cb)
      .catch((err) => cb());
    });

    response = await webdriver.executeAsyncScript((cb) => {
      fetch(new URL(`/test/uniqueValue`, location).href)
      .then((response) => response.text())
      .then((responseBody) => cb(responseBody))
      .catch((err) => cb(err.message));
    });
    const secondResponse = response.trim();
    expect(secondResponse).to.not.equal(firstResponse);

    const cacheNames = await webdriver.executeAsyncScript((cb) => {
      caches.keys()
      .then(cb)
      .catch((err) => cb());
    });
    expect(cacheNames.length).to.equal(0);
  });
});
