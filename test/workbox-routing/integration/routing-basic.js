const expect = require('chai').expect;
const seleniumAssistant = require('selenium-assistant');

describe(`[workbox-routing] Basic Route`, function() {
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

  const TEST_PAGE_URL = `${testServerAddress}/test/workbox-routing/static/routing-basic/`;
  const SW_URL = `${TEST_PAGE_URL}sw.js`;

  it(`should honor a route created by a Route object`, async function() {
    await webdriver.get(TEST_PAGE_URL);
    await activateSW(SW_URL);

    const testUrl = `${testServerAddress}/routeObject`;
    const responseBody = await webdriver.executeAsyncScript((testUrl, cb) => {
      fetch(testUrl)
        .then((response) => response.text())
        .then((responseBody) => cb(responseBody))
        .catch((err) => cb(err.message));
    }, testUrl);

    expect(responseBody).to.eql(testUrl);
  });

  it(`should honor a same-origin route created by a string`, async function() {
    await webdriver.get(TEST_PAGE_URL);
    await activateSW(SW_URL);

    const testUrl = `${testServerAddress}/sameOrigin`;
    const responseBody = await webdriver.executeAsyncScript((testUrl, cb) => {
      fetch(testUrl)
        .then((response) => response.text())
        .then((responseBody) => cb(responseBody))
        .catch((err) => cb(err.message));
    }, testUrl);

    expect(responseBody).to.eql(testUrl);
  });

  it(`should honor a cross-origin route created by a string`, async function() {
    await webdriver.get(TEST_PAGE_URL);
    await activateSW(SW_URL);

    const testUrl = 'https://example.com/crossOrigin';
    const responseBody = await webdriver.executeAsyncScript((testUrl, cb) => {
      fetch(testUrl)
        .then((response) => response.text())
        .then((responseBody) => cb(responseBody))
        .catch((err) => cb(err.message));
    }, testUrl);

    expect(responseBody).to.eql(testUrl);
  });

  it(`should return a 404 when passed a URL that isn't routed and doesn't exist`, async function() {
    await webdriver.get(TEST_PAGE_URL);
    await activateSW(SW_URL);

    const testUrl = `${testServerAddress}/doesNotMatch`;
    const responseStatus = await webdriver.executeAsyncScript((testUrl, cb) => {
      fetch(testUrl)
        .then((response) => cb(response.status))
        .catch((err) => cb(err.message));
    }, testUrl);

    expect(responseStatus).to.eql(404);
  });
});
