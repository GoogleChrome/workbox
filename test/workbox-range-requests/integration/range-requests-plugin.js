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
    const dummyUrl = `${testPageUrl}this-file-doesnt-exist.txt`;
    const dummyBody = '0123456789';

    await webdriver.get(testPageUrl);
    await activateSW(swUrl);

    const partialResponseBody = await webdriver.executeAsyncScript((dummyUrl, dummyBody, cb) => {
      const dummyResponse = new Response(dummyBody);
      // Prime the cache, and then make the Range: request.
      caches.open('range-requests-integration-test')
        .then((cache) => cache.put(dummyUrl, dummyResponse))
        .then(() => fetch(new Request(dummyUrl, {headers: {Range: `bytes=5-6`}})))
        .then((response) => response.text())
        .then((text) => cb(text))
        .catch((error) => cb(error.message));
    }, dummyUrl, dummyBody);

    // The values used for the byte range are inclusive, so we'll end up with
    // 11 characters returned in the partial response.
    expect(partialResponseBody).to.eql('56');

    const errorResponse = await webdriver.executeAsyncScript((dummyUrl, cb) => {
      // These are arbitrary large values that extend past the end of the file.
      fetch(new Request(dummyUrl, {headers: {Range: `bytes=100-101`}}))
        .then((response) => cb(response));
    }, dummyUrl);

    // The expected error status is 416 (Range Not Satisfiable)
    expect(errorResponse.status).to.eql(416);
  });
});
