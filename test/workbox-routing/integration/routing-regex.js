const expect = require('chai').expect;
const seleniumAssistant = require('selenium-assistant');

describe(`[workbox-routing] Route via RegExp`, function() {
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

  it(`should load a page a route requests`, async function() {
    const testingURl = `${testServerAddress}/test/workbox-routing/static/routing-regex/`;
    const SW_URL = `${testingURl}sw.js`;

    // Load the page and wait for the first service worker to register and activate.
    await webdriver.get(testingURl);

    // Register the service worker.
    await activateSW(SW_URL);

    let testCounter = 0;

    let response = await webdriver.executeAsyncScript((testCounter, cb) => {
      fetch(new URL(`/RegExp/${testCounter}/`, location).href)
      .then((response) => response.text())
      .then((responseBody) => cb(responseBody))
      .catch((err) => cb(err.message));
    }, testCounter);

    expect(response).to.equal(`RegExp.${testServerAddress}/RegExp/${testCounter}/`);

    testCounter += 1;

    response = await webdriver.executeAsyncScript((testCounter, cb) => {
      fetch(new URL(`/regular-expression/${testCounter}/`, location).href)
      .then((response) => response.text())
      .then((responseBody) => cb(responseBody))
      .catch((err) => cb(err.message));
    }, testCounter);

    expect(response).to.equal(`regular-expression.${testServerAddress}/regular-expression/${testCounter}/`);

    testCounter += 1;

    response = await webdriver.executeAsyncScript((testCounter, cb) => {
      fetch(new URL(`/RegExpRoute/RegExp/${testCounter}/`, location).href)
      .then((response) => response.text())
      .then((responseBody) => cb(responseBody))
      .catch((err) => cb(err.message));
    }, testCounter);

    expect(response).to.equal(`RegExpRoute.RegExp.${testServerAddress}/RegExpRoute/RegExp/${testCounter}/`);

    testCounter += 1;

    response = await webdriver.executeAsyncScript((testCounter, cb) => {
      fetch(new URL(`/RegExpRoute/regular-expression/${testCounter}/`, location).href)
      .then((response) => response.text())
      .then((responseBody) => cb(responseBody))
      .catch((err) => cb(err.message));
    }, testCounter);

    expect(response).to.equal(`RegExpRoute.regular-expression.${testServerAddress}/RegExpRoute/regular-expression/${testCounter}/`);

    testCounter += 1;
  });
});
