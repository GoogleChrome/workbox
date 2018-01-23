const expect = require('chai').expect;
const seleniumAssistant = require('selenium-assistant');

describe(`rangeRequests.Plugin`, function() {
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
      navigator.serviceWorker.register(swFile).then(() => {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (navigator.serviceWorker.controller.scriptURL.endsWith(swFile)) {
            cb();
          }
        });
      }).catch((error) => cb(error.message));
    }, swFile);

    if (error) {
      throw error;
    }
  };

  it(`should return a partial response that satisfies the request's Range: header, and an error response when it can't be satisfied`, async function() {
    const testPageUrl = `${testServerAddress}/test/workbox-range-requests/static/`;
    const swUrl = `${testPageUrl}sw.js`;
    const fileUrl = `${testPageUrl}file.txt`;

    await webdriver.get(testPageUrl);
    await activateSW(swUrl);

    const partialResponseBody = await webdriver.executeAsyncScript((fileUrl, cb) => {
      // Prime the cache, and then make the Range: request.
      caches.open('range-requests-integration-test')
        .then((cache) => cache.add(fileUrl))
        .then(() => fetch(new Request(fileUrl, {headers: {Range: `bytes=10-20`}})))
        .then((response) => response.text())
        .then((text) => cb(text))
        .catch((error) => cb(error.message));
    }, fileUrl);

    // The values used for the byte range are inclusive, so we'll end up with
    // 11 characters returned in the partial response.
    expect(partialResponseBody).to.eql('01234567890');

    const errorResponse = await webdriver.executeAsyncScript((fileUrl, cb) => {
      // These are arbitrary large values that extend past the end of the file.
      fetch(new Request(fileUrl, {headers: {Range: `bytes=1000000000-1000000001`}}))
        .then((response) => cb(response));
    }, fileUrl);

    // The expected error status is 416 (Range Not Satisfiable)
    expect(errorResponse.status).to.eql(416);
  });
});
